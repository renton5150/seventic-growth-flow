
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-endpoint',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API token from query parameters
    const url = new URL(req.url);
    const apiToken = url.searchParams.get('api_token');
    
    if (!apiToken) {
      console.error("Missing API token in request");
      return new Response(JSON.stringify({ error: 'API token is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the Acelle API endpoint from the request headers
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    
    if (!acelleEndpoint) {
      console.error("Missing Acelle endpoint in request headers");
      return new Response(JSON.stringify({ error: 'Acelle endpoint is missing' }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Received request to endpoint: ${acelleEndpoint} with method ${req.method}`);

    // Parse the URL path
    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    // Build Acelle API URL - FIXED: Avoid double api/v1 path
    // Make sure the endpoint doesn't end with a slash to properly join with the path
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    
    let acelleApiUrl;
    if (resourceId) {
      // Don't add api/v1 if it's already in the endpoint
      const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}/${resourceId}?api_token=${apiToken}`;
    } else {
      // Copy all query parameters except api_token which is handled specially
      const queryParams = new URLSearchParams();
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'api_token') {
          queryParams.append(key, value);
        }
      }
      queryParams.append('api_token', apiToken);
      
      // Don't add api/v1 if it's already in the endpoint
      const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
    }

    console.log(`Proxying request to Acelle API: ${acelleApiUrl}`);

    // Prepare headers for the Acelle API request
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Proxy/1.0'
    };

    // Only add Content-Type for requests with body
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    // Forward the request to Acelle API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : await req.text(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log the response status
      console.log(`Acelle API response: ${response.status} ${response.statusText} for ${acelleApiUrl}`);

      // Read response data
      const data = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(data);
        console.log(`Successfully parsed JSON response for ${resource}`);
      } catch (e) {
        console.error('Error parsing response from Acelle API:', e);
        console.error('Raw response data:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        responseData = { 
          error: 'Failed to parse response from Acelle API', 
          status: response.status,
          message: data.substring(0, 1000),
          url: acelleApiUrl
        };
      }

      // Return the response
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error(`Request to ${acelleApiUrl} timed out`);
        return new Response(JSON.stringify({ 
          error: 'Request timed out', 
          endpoint: acelleEndpoint,
          url: acelleApiUrl 
        }), { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error in Acelle Proxy:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
