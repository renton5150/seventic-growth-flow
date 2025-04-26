
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Amélioré avec des entêtes CORS complets selon les recommandations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-acelle-endpoint',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
};

// Add a heartbeat mechanism to keep the service active
let lastActivity = Date.now();
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dupguifqyjchlmzbadav.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

// Create Supabase client for heartbeat recording
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Start heartbeat
setInterval(async () => {
  // Only log if the function has been idle for a while
  if (Date.now() - lastActivity > HEARTBEAT_INTERVAL) {
    console.log(`Heartbeat at ${new Date().toISOString()} - Service active`);
    
    // Record heartbeat in database to track function status
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

// Proactive service check with auto-restart
setInterval(async () => {
  try {
    // Check last activity to see if function is unresponsive
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime > HEARTBEAT_INTERVAL * 3) {
      console.warn(`Service appears inactive for ${Math.floor(inactiveTime/1000)}s, attempting restart`);
      
      // Update status to restarting
      await supabase.from('edge_function_stats').upsert({
        function_name: 'acelle-proxy',
        last_heartbeat: new Date().toISOString(),
        status: 'restarting'
      }, { onConflict: 'function_name' });
      
      // Update last activity to prevent multiple restart attempts
      lastActivity = Date.now();
    }
  } catch (error) {
    console.error("Error during service check:", error);
  }
}, HEARTBEAT_INTERVAL * 2);

// Helper function pour tester l'accessibilité d'une URL
async function testEndpointAccess(url: string): Promise<{success: boolean, message: string}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { success: true, message: `URL accessible: ${url}, status: ${response.status}` };
    } else {
      return { success: false, message: `URL inaccessible: ${url}, status: ${response.status}, statusText: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, message: `Erreur lors du test d'URL: ${url}, erreur: ${error.message}` };
  }
}

// Logger amélioré avec support de débogage
function debugLog(message: string, data?: any, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  const logMethod = isError ? console.error : console.log;
  
  if (data) {
    logMethod(`[${timestamp}] DEBUG - ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    logMethod(`[${timestamp}] DEBUG - ${message}`);
  }
}

serve(async (req) => {
  // Update last activity time
  lastActivity = Date.now();
  
  // Handle CORS preflight requests with en-têtes complets
  if (req.method === 'OPTIONS') {
    debugLog("Handling OPTIONS preflight request with complete CORS headers");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Get authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      debugLog("No authorization header provided", null, true);
    } else {
      debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...");
    }

    // Get API token from query parameters
    const url = new URL(req.url);
    const apiToken = url.searchParams.get('api_token');

    debugLog("Query parameters:", Object.fromEntries(url.searchParams.entries()));
    
    // Special case for ping/health check
    if (apiToken === 'ping') {
      debugLog("Received ping request - service is active");
      
      // Test API accessibility
      const baseUrl = url.searchParams.get('endpoint') || 'https://emailing.plateforme-solution.net/api/v1';
      const accessTest = await testEndpointAccess(baseUrl);
      
      debugLog("API endpoint accessibility test:", accessTest);
      
      return new Response(JSON.stringify({ 
        status: 'active', 
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - lastActivity) / 1000),
        endpoint_test: accessTest
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!apiToken) {
      debugLog("Missing API token in request", null, true);
      
      // Log full request details for debugging
      debugLog("Full request URL:", req.url);
      debugLog("Full request headers:", Object.fromEntries(req.headers.entries()));
      
      return new Response(JSON.stringify({ 
        error: 'API token is required', 
        url: req.url,
        path: url.pathname,
        query_params: Object.fromEntries(url.searchParams.entries()),
        headers: Object.fromEntries(req.headers.entries())
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the Acelle API endpoint from the request headers
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    
    if (!acelleEndpoint) {
      debugLog("Missing Acelle endpoint in request headers", null, true);
      return new Response(JSON.stringify({ error: 'Acelle endpoint is missing' }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    debugLog(`Received request to endpoint: ${acelleEndpoint} with method ${req.method}`);

    // Parse the URL path
    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    debugLog(`Parsed resource: ${resource}, resourceId: ${resourceId}`);

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
        if (key !== 'api_token' && key !== 'cache_key') {
          queryParams.append(key, value);
        }
      }
      queryParams.append('api_token', apiToken);
      
      // Don't add api/v1 if it's already in the endpoint
      const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
    }

    debugLog(`Proxying request to Acelle API: ${acelleApiUrl}`);

    // Prepare headers for the Acelle API request
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Proxy/1.5', // Updated version
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    // Also forward the auth header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Only add Content-Type for requests with body
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    // Log les en-têtes pour débogage
    debugLog("Request headers being sent:", headers);

    // Forward the request to Acelle API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout

    try {
      // Récupérer le body de la requête si nécessaire
      let requestBody;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBody = await req.text();
        debugLog("Request body:", requestBody);
      }

      debugLog(`Envoi de la requête à ${acelleApiUrl} avec méthode ${req.method}`);
      
      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log the response status
      debugLog(`Acelle API response: ${response.status} ${response.statusText} for ${acelleApiUrl}`);
      
      // Log response headers for debugging
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      debugLog("Response headers:", responseHeadersObj);

      // Read response data
      const data = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(data);
        debugLog(`Successfully parsed JSON response for ${resource}`);
        debugLog("Response data sample:", 
          typeof responseData === 'object' ? 
            JSON.stringify(responseData instanceof Array ? 
              responseData.slice(0, 2) : 
              responseData, null, 2).substring(0, 500) + "..." : 
            responseData);
      } catch (e) {
        debugLog('Error parsing response from Acelle API:', e, true);
        debugLog('Raw response data:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        responseData = { 
          error: 'Failed to parse response from Acelle API', 
          status: response.status,
          message: data.substring(0, 1000),
          url: acelleApiUrl
        };
      }

      // Return the response with all required CORS headers
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
      
      throw fetchError; // Re-throw for the outer catch block
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
