
// This is a CORS Proxy edge function to safely handle third-party API requests
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Enhanced CORS headers to support more browsers and preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-api-key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
};

// Current version of the CORS proxy
const CORS_PROXY_VERSION = "1.0.4";

console.log("CORS Proxy starting up...");

serve(async (req: Request) => {
  console.log("Listening on http://localhost:9999/");
  
  // Debug info to help identify URL being requested
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[CORS Proxy] Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Special /ping endpoint for health checks and wakeup calls
  if (path.endsWith('/ping')) {
    console.log("[CORS Proxy] Ping request received to wake up Edge Function");
    return new Response(
      JSON.stringify({
        status: "healthy",
        message: "CORS Proxy is running",
        timestamp: new Date().toISOString(),
        version: CORS_PROXY_VERSION
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
  
  try {
    // Get target URL from the query parameter
    const params = url.searchParams;
    const targetUrl = params.get('url');
    
    if (!targetUrl) {
      console.error("[CORS Proxy] Missing URL parameter");
      return new Response(
        JSON.stringify({ 
          error: "Missing URL parameter", 
          usage: "Add ?url=https://yourapi.com/endpoint as a query parameter"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`[CORS Proxy] Forwarding request to: ${targetUrl}`);
    
    // Create new request with the same method, headers, and body
    const requestInit: RequestInit = {
      method: req.method,
      headers: new Headers()
    };
    
    // Copy headers from original request, except those related to CORS and connection
    const headersToSkip = ['host', 'connection', 'origin', 'referer'];
    for (const [key, value] of req.headers.entries()) {
      if (!headersToSkip.includes(key.toLowerCase())) {
        (requestInit.headers as Headers).set(key, value);
      }
    }
    
    // Add user agent header to identify our proxy
    (requestInit.headers as Headers).set('User-Agent', 'Seventic-CORS-Proxy/1.0');
    
    // Copy body if present
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      requestInit.body = req.body;
    }
    
    // Add automatic timeout
    const timeoutId = setTimeout(() => {
      console.error(`[CORS Proxy] Request timeout after 30s: ${targetUrl}`);
    }, 30000);
    
    // Make the request to the target URL
    const fetchResponse = await fetch(targetUrl, requestInit);
    clearTimeout(timeoutId);
    
    // Prepare response headers
    const responseHeaders = new Headers(corsHeaders);
    
    // Copy headers from the response
    for (const [key, value] of fetchResponse.headers.entries()) {
      if (key.toLowerCase() !== 'content-length') { // Skip content-length as it may change
        responseHeaders.set(key, value);
      }
    }
    
    // Ensure content type is preserved
    if (fetchResponse.headers.has('content-type')) {
      responseHeaders.set('Content-Type', fetchResponse.headers.get('content-type')!);
    }
    
    // Log response status
    console.log(`[CORS Proxy] Target response status: ${fetchResponse.status} ${fetchResponse.statusText} for ${targetUrl}`);
    
    // Read response body
    let responseBody = await fetchResponse.text();
    
    // Pour le débogage, ajoutons une trace des réponses 404 avec plus de détail
    if (fetchResponse.status === 404) {
      console.error(`[CORS Proxy] 404 Not Found: ${targetUrl}`);
      console.error(`[CORS Proxy] Response headers:`, Object.fromEntries([...fetchResponse.headers]));
      console.error(`[CORS Proxy] Response body (first 1000 chars): ${responseBody.substring(0, 1000)}`);
      
      // Si la réponse est JSON, essayez de l'analyser pour le débogage
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.error("[CORS Proxy] JSON response structure:", Object.keys(jsonResponse));
      } catch (e) {
        // Pas de JSON, ignorer
      }
    }
    
    // Debug for server errors
    if (fetchResponse.status >= 500) {
      console.error(`[CORS Proxy] Server error from target: ${responseBody.substring(0, 500)}...`);
    }
    
    // Log API endpoints for campaigns specifically to debug issues
    if (targetUrl.includes('/campaigns')) {
      console.log(`[CORS Proxy] Campaign request made to: ${targetUrl}`);
      if (fetchResponse.status === 200) {
        try {
          const jsonData = JSON.parse(responseBody);
          console.log(`[CORS Proxy] Campaign data structure: ${typeof jsonData}, length: ${Array.isArray(jsonData) ? jsonData.length : 'not an array'}`);
        } catch (e) {
          console.error(`[CORS Proxy] Failed to parse campaign data: ${e.message}`);
        }
      }
    }
    
    // Return proxied response with CORS headers
    return new Response(responseBody, {
      status: fetchResponse.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error(`[CORS Proxy] Error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: `Proxy error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
