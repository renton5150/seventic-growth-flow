import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-acelle-endpoint, x-acelle-token, x-page, x-per-page, x-include-stats, Origin, Accept',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

let lastActivity = Date.now();
const HEARTBEAT_INTERVAL = 30 * 1000;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dupguifqyjchlmzbadav.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog("Token JWT Supabase manquant ou invalide", null, true);
      return new Response(JSON.stringify({ 
        error: 'Token JWT Supabase manquant ou invalide',
        message: 'Authentification requise'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabaseToken = authHeader.substring(7);
    const url = new URL(req.url);
    
    if (url.pathname.includes('/test-acelle-connection')) {
      try {
        debugLog("Test connection request received");
        
        const acelleEndpoint = req.headers.get('x-acelle-endpoint');
        const acelleToken = req.headers.get('x-acelle-token');
        
        if (!acelleEndpoint || !acelleToken) {
          return new Response(JSON.stringify({
            success: false,
            message: "Missing x-acelle-endpoint or x-acelle-token headers",
            details: {
              endpoint: acelleEndpoint ? "présent" : "manquant",
              token: acelleToken ? "présent" : "manquant"
            }
          }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
        const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
        
        debugLog(`Verifying endpoint availability: ${cleanEndpoint}`);
        
        try {
          const pingController = new AbortController();
          const pingTimeout = setTimeout(() => pingController.abort(), 5000);
          
          const pingResponse = await fetch(cleanEndpoint, {
            method: "HEAD",
            headers: {
              'User-Agent': 'Seventic-Acelle-Tester/1.1',
              'Accept': '*/*'
            },
            signal: pingController.signal
          });
          
          clearTimeout(pingTimeout);
          
          if (!pingResponse.ok) {
            return new Response(JSON.stringify({
              success: false,
              statusCode: pingResponse.status,
              message: `L'API n'est pas disponible - Erreur ${pingResponse.status} ${pingResponse.statusText}`,
              details: {
                endpoint: cleanEndpoint,
                status: pingResponse.status,
                statusText: pingResponse.statusText
              }
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          debugLog(`Endpoint is accessible: ${cleanEndpoint}`);
        } catch (pingError) {
          debugLog(`Error pinging endpoint: ${pingError.message}`, null, true);
          return new Response(JSON.stringify({
            success: false,
            error: pingError.message,
            message: `Impossible d'accéder à l'endpoint - ${pingError.name === "AbortError" ? "Délai dépassé" : pingError.message}`,
            details: {
              endpoint: cleanEndpoint,
              error: pingError.message,
              timeout: pingError.name === "AbortError"
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const testUrl = `${cleanEndpoint}${apiPath}/me?api_token=${acelleToken}`;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          debugLog(`Testing API connection with URL: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: "GET",
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Seventic-Acelle-Tester/1.1'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          const statusCode = response.status;
          let responseData;
          
          try {
            responseData = await response.json();
          } catch (e) {
            try {
              const textResponse = await response.clone().text();
              responseData = { error: textResponse };
            } catch (textErr) {
              responseData = { error: "Failed to read response" };
            }
          }
          
          return new Response(JSON.stringify({
            success: statusCode >= 200 && statusCode < 300,
            statusCode: statusCode,
            response: responseData,
            message: statusCode === 403 ? 
              "Accès API refusé (403). Vérifiez votre token API et les paramètres d'autorisation." : 
              `L'API a répondu avec le statut ${statusCode}`,
            details: {
              endpoint: cleanEndpoint,
              status: statusCode,
              isError: statusCode >= 400
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (fetchError) {
          const isTimeout = fetchError.name === "AbortError";
          debugLog(`API test error: ${fetchError.message}`, null, true);
          
          return new Response(JSON.stringify({
            success: false,
            error: fetchError.message,
            message: isTimeout ? 
              "Délai d'attente dépassé lors de la connexion à l'API. Le serveur est peut-être lent ou inaccessible." : 
              `Erreur lors du test de connexion: ${fetchError.message}`,
            details: {
              endpoint: cleanEndpoint,
              timeout: isTimeout,
              error: fetchError.message
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        debugLog("Error in test connection:", error, true);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          message: `Erreur lors du test de connexion à l'API: ${error.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    const acelleToken = req.headers.get('x-acelle-token');
    
    if (!acelleEndpoint) {
      debugLog("Point de terminaison Acelle manquant dans les en-têtes de la requête", null, true);
      return new Response(JSON.stringify({ error: 'Le point de terminaison Acelle est manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!acelleToken) {
      debugLog("Token API Acelle manquant", null, true);
      return new Response(JSON.stringify({ 
        error: 'Token API Acelle manquant',
        message: 'Le token API Acelle est requis'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    debugLog("Token API Acelle détecté:", acelleToken.substring(0, 10) + "...");

    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
    
    let requestPath = resourceId ? `${apiPath}/${resource}/${resourceId}` : `${apiPath}/${resource}`;
    requestPath += (requestPath.includes('?') ? '&' : '?') + `api_token=${acelleToken}`;
    
    const queryParams = new URLSearchParams(url.search);
    for (const [key, value] of queryParams.entries()) {
      if (key !== 'api_token' && key !== 'cache_key') {
        requestPath += `&${key}=${value}`;
      }
    }

    debugLog(`Transmission de la requête à l'API Acelle: ${cleanEndpoint}${requestPath}`);

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Proxy/2.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    debugLog("En-têtes de requête envoyés:", headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      let requestBody;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBody = await req.text();
        debugLog("Corps de la requête:", requestBody);
      }

      const response = await fetch(`${cleanEndpoint}${requestPath}`, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 302) {
        debugLog("Échec d'authentification - redirigé vers la page de connexion", null, true);
        return new Response(JSON.stringify({
          error: "Échec d'authentification",
          message: "L'API a redirigé vers la page de connexion"
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      debugLog(`Réponse de l'API Acelle: ${response.status} ${response.statusText}`);

      const data = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(data);
        debugLog("Analyse réussie de la réponse JSON");
      } catch (e) {
        debugLog('Erreur d\'analyse de la réponse de l\'API Acelle:', e, true);
        responseData = { 
          error: 'Échec de l\'analyse de la réponse',
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
        debugLog(`La requête a expiré`, null, true);
        return new Response(JSON.stringify({ 
          error: 'La requête a expiré',
          endpoint: acelleEndpoint
        }), { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    debugLog('Erreur dans le proxy Acelle:', error, true);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
