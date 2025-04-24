
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
      return new Response(JSON.stringify({ error: 'API token is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the Acelle API endpoint from the request headers
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    
    if (!acelleEndpoint) {
      return new Response(JSON.stringify({ error: 'Acelle endpoint is missing' }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the URL path
    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    // Build Acelle API URL
    let acelleApiUrl;
    if (resourceId) {
      acelleApiUrl = `${acelleEndpoint}/api/v1/${resource}/${resourceId}?api_token=${apiToken}`;
    } else {
      // Copy all query parameters except api_token which is handled specially
      const queryParams = new URLSearchParams();
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'api_token') {
          queryParams.append(key, value);
        }
      }
      queryParams.append('api_token', apiToken);
      
      acelleApiUrl = `${acelleEndpoint}/api/v1/${resource}?${queryParams.toString()}`;
    }

    console.log(`Proxying request to Acelle API: ${acelleApiUrl}`);

    // Forward the request to Acelle API
    const response = await fetch(acelleApiUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': req.headers.get('Content-Type') || 'application/json',
      },
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : await req.text(),
    });

    // Read response data
    const data = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing response from Acelle API:', e);
      responseData = { error: 'Failed to parse response from Acelle API', raw: data };
    }

    // Return the response
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
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
