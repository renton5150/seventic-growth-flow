
// This is a CORS Proxy edge function to safely handle third-party API requests
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Enhanced CORS headers with broader support for browsers and preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-api-key, x-wake-request, origin, accept, pragma',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
  'Vary': 'Origin', // Important pour les CDNs et caches intermédiaires
  'Content-Type': 'application/json'
};

// Current version of the CORS proxy
const CORS_PROXY_VERSION = "1.1.0";

console.log("CORS Proxy starting up...");

serve(async (req: Request) => {
  console.log("CORS Proxy activated");
  
  // Always log origin for debugging CORS issues
  const origin = req.headers.get('origin');
  const requestUrl = new URL(req.url);
  console.log(`Request from origin: ${origin || 'unknown'} to path: ${requestUrl.pathname}`);
  
  // Set default headers for all responses with dynamic origin handling
  let responseHeaders = new Headers(corsHeaders);
  if (origin) {
    // Reflect the requesting origin to support multiple origins
    responseHeaders.set('Access-Control-Allow-Origin', origin);
  }
  
  // Handle OPTIONS preflight requests with improved CORS headers
  if (req.method === 'OPTIONS') {
    console.log("[CORS Proxy] Handling OPTIONS preflight request");
    
    // Return early with proper preflight response
    return new Response(null, {
      status: 204,
      headers: responseHeaders
    });
  }
  
  // Special /ping endpoint for health checks and wakeup calls
  if (requestUrl.pathname.endsWith('/ping')) {
    console.log("[CORS Proxy] Ping request received to wake up Edge Function");
    
    responseHeaders.set('Content-Type', 'application/json');
    
    return new Response(
      JSON.stringify({
        status: "healthy",
        message: "CORS Proxy is running",
        timestamp: new Date().toISOString(),
        version: CORS_PROXY_VERSION,
        received_origin: origin || 'none'
      }),
      {
        status: 200,
        headers: responseHeaders
      }
    );
  }
  
  try {
    // Get target URL from the query parameter
    const params = requestUrl.searchParams;
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
          headers: responseHeaders
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
    const headersToSkip = ['host', 'connection'];
    for (const [key, value] of req.headers.entries()) {
      if (!headersToSkip.includes(key.toLowerCase())) {
        (requestInit.headers as Headers).set(key, value);
      }
    }
    
    // Add user agent header to identify our proxy
    (requestInit.headers as Headers).set('User-Agent', 'Seventic-CORS-Proxy/1.1');
    (requestInit.headers as Headers).set('Referer', 'https://emailing.plateforme-solution.net/');
    
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
    
    // Copy headers from the response, excluding CORS headers that we'll set ourselves
    for (const [key, value] of fetchResponse.headers.entries()) {
      if (!key.toLowerCase().startsWith('access-control-') && key.toLowerCase() !== 'content-length') {
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
        headers: responseHeaders
      }
    );
  }
});
