
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-auth-method, cache-control, x-wake-request",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

console.log("CORS Proxy starting up...");

serve(async (req) => {
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === "OPTIONS") {
    console.log("[CORS Proxy] Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // For special wake-up ping requests
  const url = new URL(req.url);
  
  // Handle both /ping and ping endpoint formats
  if (url.pathname.includes('ping')) {
    console.log("[CORS Proxy] Ping request received to wake up Edge Function");
    return new Response(JSON.stringify({ 
      status: "healthy", 
      message: "CORS Proxy is running", 
      timestamp: new Date().toISOString(),
      version: "1.0.3" 
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });
  }

  // Extract target URL from request
  const targetUrl = url.searchParams.get("url");
  console.log(`[CORS Proxy] Request received: ${req.method} ${req.url}`);
  console.log(`[CORS Proxy] Target URL: ${targetUrl}`);

  if (!targetUrl) {
    console.error("[CORS Proxy] Error: Missing 'url' parameter");
    return new Response(JSON.stringify({
      error: "Missing required 'url' parameter"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    console.log(`[CORS Proxy] Forwarding to: ${targetUrl}`);
    
    // Prepare headers to forward
    const headers = new Headers();
    
    // Copy relevant headers from original request
    for (const [key, value] of req.headers.entries()) {
      // Skip some headers that should not be forwarded
      if (
        !key.toLowerCase().startsWith("cf-") &&
        !key.toLowerCase().startsWith("x-forwarded") &&
        key.toLowerCase() !== "host" &&
        key.toLowerCase() !== "connection"
      ) {
        headers.set(key, value);
      }
    }
    
    // Add additional headers to help with caching issues
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    
    console.log(`[CORS Proxy] Headers being forwarded:`, 
      Object.fromEntries([...headers.entries()]));

    // Determine request body to forward
    let proxyBody = null;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      proxyBody = await req.arrayBuffer();
    }

    // Measure response time
    const startTime = Date.now();
    
    // Set up timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("[CORS Proxy] Request timed out after 30 seconds");
    }, 30000);
    
    try {
      // Forward request to target URL
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: proxyBody,
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      console.log(`[CORS Proxy] Response received: ${response.status} in ${responseTime}ms`);

      // Prepare response headers
      const responseHeaders = new Headers(corsHeaders);
      
      // Copy relevant headers from target response
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase() !== "content-encoding" && 
            !key.toLowerCase().startsWith("access-control")) {
          responseHeaders.set(key, value);
        }
      }

      // Get response body
      const body = await response.arrayBuffer();

      // Log response for debugging
      try {
        if (response.headers.get("content-type")?.includes("application/json")) {
          const textData = new TextDecoder().decode(body);
          console.log("[CORS Proxy] JSON response (first 500 chars):", 
            textData.substring(0, 500) + (textData.length > 500 ? "..." : ""));
          
          // Try to parse JSON to see if there's an error structure
          try {
            const jsonData = JSON.parse(textData);
            if (jsonData.error || jsonData.exception || jsonData.message) {
              console.log("[CORS Proxy] API error details:", 
                JSON.stringify({ error: jsonData.error, exception: jsonData.exception, message: jsonData.message }));
            }
          } catch (e) {
            // Not JSON or parsing error, ignore
          }
        } else {
          console.log("[CORS Proxy] Non-JSON response received");
          const textPreview = new TextDecoder().decode(body.slice(0, 200));
          console.log("[CORS Proxy] Response preview:", textPreview + (body.byteLength > 200 ? "..." : ""));
        }
      } catch (e) {
        console.error("[CORS Proxy] Error processing response:", e);
      }

      // Return response
      return new Response(body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error(`[CORS Proxy] Error: ${error.message || error}`);
    
    let errorMessage = error.message || "Unknown error";
    let errorDetails = error.stack || "No stack trace available";
    
    if (error.name === "AbortError") {
      errorMessage = "Request timed out after 30 seconds";
      errorDetails = "The request to the target server took too long to complete";
    }
    
    return new Response(JSON.stringify({
      error: `Proxy error: ${errorMessage}`,
      details: errorDetails,
      targetUrl: targetUrl
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
