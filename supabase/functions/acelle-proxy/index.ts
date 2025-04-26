
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, x-acelle-endpoint',
  'Access-Control-Max-Age': '86400'
};

// Improved heartbeat mechanism
let lastActivity = Date.now();
const HEARTBEAT_INTERVAL = 30 * 1000;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dupguifqyjchlmzbadav.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

// Create Supabase client for heartbeat recording
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Heartbeat recorder
setInterval(async () => {
  if (Date.now() - lastActivity > HEARTBEAT_INTERVAL) {
    console.log(`Heartbeat at ${new Date().toISOString()} - Service active`);
    try {
      await supabase.from('edge_function_stats').upsert({
        function_name: 'acelle-proxy',
        last_heartbeat: new Date().toISOString(),
        status: 'active'
      }, { onConflict: 'function_name' });
    } catch (error) {
      console.error("Failed to record heartbeat:", error);
    }
  }
  lastActivity = Date.now();
}, HEARTBEAT_INTERVAL);

function debugLog(message: string, data?: any, isError = false) {
  const timestamp = new Date().toISOString();
  const logMethod = isError ? console.error : console.log;
  if (data) {
    logMethod(`[${timestamp}] DEBUG - ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    logMethod(`[${timestamp}] DEBUG - ${message}`);
  }
}

serve(async (req) => {
  lastActivity = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      debugLog("No authorization header provided", null, true);
    } else {
      debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...");
    }

    const url = new URL(req.url);
    const apiToken = url.searchParams.get('api_token');
    
    // Special case for ping/health check
    if (apiToken === 'ping') {
      debugLog("Received ping request - service is active");
      return new Response(JSON.stringify({ 
        status: 'active',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - lastActivity) / 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // IMPORTANT: Maintenant nous extrayons le token soit de l'URL, soit du header Authorization
    let accessToken = apiToken;
    
    // Si pas de token dans l'URL, essayons d'extraire du header Authorization
    if (!accessToken && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        debugLog("Using Bearer token from Authorization header");
      }
    }
    
    if (!accessToken) {
      debugLog("No API token found in request parameters or Authorization header", null, true);
      return new Response(JSON.stringify({ 
        error: 'API token is required in URL parameter or Authorization header',
        url: req.url,
        path: url.pathname,
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    if (!acelleEndpoint) {
      debugLog("Missing Acelle endpoint in request headers", null, true);
      return new Response(JSON.stringify({ error: 'Acelle endpoint is missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    // Build Acelle API URL with proper authentication
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
    
    // Construire les paramètres d'URL - toujours inclure api_token même si on utilise Bearer
    const queryParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'api_token' && key !== 'cache_key') {
        queryParams.append(key, value);
      }
    }
    // Toujours ajouter le token API en paramètre d'URL comme méthode d'authentification principale
    queryParams.append('api_token', accessToken);

    let acelleApiUrl;
    if (resourceId) {
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}/${resourceId}?${queryParams.toString()}`;
    } else {
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
    }

    debugLog(`Proxying request to Acelle API: ${acelleApiUrl}`);

    // Prepare headers with both Bearer token and API token
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`, // Ajouter Bearer Token comme méthode d'authentification secondaire
      'User-Agent': 'Seventic-Acelle-Proxy/1.7',
      'X-Requested-With': 'XMLHttpRequest',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    debugLog("Request headers being sent:", headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      let requestBody;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBody = await req.text();
        debugLog("Request body:", requestBody);
      }

      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for authentication redirect
      if (response.status === 302) {
        debugLog("Authentication failed - redirected to login", null, true);
        return new Response(JSON.stringify({
          error: "Authentication failed",
          message: "API redirected to login page"
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      debugLog(`Acelle API response: ${response.status} ${response.statusText}`);

      const data = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(data);
        debugLog("Successfully parsed JSON response");
      } catch (e) {
        debugLog('Error parsing response from Acelle API:', e, true);
        responseData = { 
          error: 'Failed to parse response',
          status: response.status,
          message: data.substring(0, 1000)
        };
      }

      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        debugLog(`Request to ${acelleApiUrl} timed out`, null, true);
        return new Response(JSON.stringify({ 
          error: 'Request timed out',
          endpoint: acelleEndpoint,
          url: acelleApiUrl 
        }), { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    debugLog('Error in Acelle Proxy:', error, true);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
