
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get requested path and query params
    const url = new URL(req.url);
    const path = url.pathname.replace('/acelle-basic-auth', '');
    const queryString = url.search || '';
    
    // Basic Auth credentials - HARDCODED FOR NOW
    const email = "gironde@seventic.com";
    const password = "Seventic75$";
    const credentials = btoa(`${email}:${password}`);
    
    // Prepare request to Acelle Mail API
    const targetUrl = `https://emailing.plateforme-solution.net/api/v1${path}${queryString}`;
    console.log(`Proxying request to: ${targetUrl}`);
    
    const headers = new Headers();
    headers.set('Authorization', `Basic ${credentials}`);
    headers.set('Content-Type', 'application/json');
    
    // Forward the request with Basic Auth
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
        ? await req.text() 
        : undefined
    });
    
    // Check for redirects (auth failure)
    if (response.status === 302) {
      console.error("Authentication failed - redirected to login");
      return new Response(
        JSON.stringify({ 
          error: "Authentication failed", 
          message: "API redirected to login page" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Return the actual response with proper CORS headers
    const responseData = await response.text();
    return new Response(responseData, {
      status: response.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': response.headers.get('Content-Type') || 'application/json' 
      }
    });
  } catch (error) {
    console.error(`Edge function error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: "Edge function error", 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
