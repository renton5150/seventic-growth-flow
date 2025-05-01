
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Complete set of CORS headers to handle all request types
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-acelle-endpoint, x-auth-method, x-api-key, x-debug-level, x-wake-request',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

serve(async (req) => {
  // Log the request details for debugging
  console.log(`Requête proxy reçue: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    
    // Validate the target URL parameter
    if (!targetUrl) {
      console.error("URL parameter missing");
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Log original request details
    console.log("Original request method:", req.method);
    const originalHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      originalHeaders[key] = value;
    });
    console.log("Original request headers:", originalHeaders);
    
    // Get Acelle endpoint from headers if provided
    const acelleEndpoint = req.headers.get("X-Acelle-Endpoint");
    const authMethod = req.headers.get("X-Auth-Method") || "token";
    const wakeRequest = req.headers.get("X-Wake-Request");
    
    // Prepare headers for the target request, removing some of the original headers
    const headers: Record<string, string> = {
      "Accept": req.headers.get("Accept") || "application/json",
      "Content-Type": req.headers.get("Content-Type") || "application/json",
      "User-Agent": "AcelleProxy/1.0",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    };
    
    // Preserve special headers for Acelle API - case sensitivity matters
    if (acelleEndpoint) headers["X-Acelle-Endpoint"] = acelleEndpoint;
    if (authMethod) headers["X-Auth-Method"] = authMethod;
    if (wakeRequest) headers["X-Wake-Request"] = wakeRequest;
    
    // Handle various auth methods
    if (authMethod === "header" && originalHeaders["x-api-key"]) {
      headers["X-API-Key"] = originalHeaders["x-api-key"];
    }
    
    // Create request options
    const requestOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: "follow" // Follow redirects automatically
    };
    
    // Add body for POST/PUT requests
    if (["POST", "PUT"].includes(req.method)) {
      try {
        const contentType = req.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          const body = await req.json();
          requestOptions.body = JSON.stringify(body);
        } else {
          const body = await req.text();
          requestOptions.body = body;
        }
      } catch (error) {
        console.error("Error reading request body:", error);
      }
    }
    
    // Log outgoing request details
    console.log("Transfert de la requête vers:", targetUrl);
    
    // Make the actual request to the target URL
    const startTime = Date.now();
    const response = await fetch(targetUrl, requestOptions);
    const duration = Date.now() - startTime;
    
    // Log response details
    console.log("Response status:", response.status);
    console.log("Response URL:", response.url);
    
    // Log response headers
    const responseHeadersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeadersObj[key] = value;
    });
    console.log("Response headers:", responseHeadersObj);
    
    // Prepare response headers with CORS
    const responseHeaders = new Headers(corsHeaders);
    
    // Copy some response headers from the target response
    const headersToForward = [
      "Content-Type", 
      "Content-Disposition",
      "Cache-Control",
      "Etag"
    ];
    
    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });
    
    // Special handling for specific status codes
    if (response.status === 204) {
      console.log("Réponse proxy envoyée: 204 en " + duration + "ms");
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }
    
    // CRITICAL FIX: Handle the "Body already consumed" error
    // We need to clone the response before trying to read its body
    const responseClone = response.clone();
    
    // First try to parse as JSON
    try {
      const responseData = await response.json();
      console.log("Réponse proxy envoyée:", response.status, "en " + duration + "ms");
      
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: responseHeaders
      });
    } catch (jsonError) {
      // If it's not JSON, read as text from the cloned response
      try {
        const textData = await responseClone.text();
        console.log("Réponse proxy envoyée (texte):", response.status, "en " + duration + "ms");
        
        return new Response(textData, {
          status: response.status,
          headers: responseHeaders
        });
      } catch (textError) {
        console.error("Erreur lors de la lecture de la réponse:", textError);
        return new Response(JSON.stringify({ error: "Could not read response" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
  } catch (error) {
    console.error("Erreur dans la fonction CORS proxy:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
