
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
    // Vérifier l'authentification - UNIQUEMENT AVEC BEARER TOKEN
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog("Authentification invalide: Bearer token manquant ou invalide", null, true);
      return new Response(JSON.stringify({ 
        error: 'Bearer token manquant ou invalide',
        message: 'L\'API Acelle Mail exige l\'authentification par Bearer Token'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = authHeader.substring(7);
    debugLog("Bearer token détecté:", accessToken.substring(0, 10) + "...");

    const url = new URL(req.url);
    const isPingRequest = url.searchParams.get('api_token') === 'ping';
    
    // Gestion spéciale pour les requêtes de ping/vérification de santé
    if (isPingRequest) {
      debugLog("Requête de ping reçue - service actif");
      return new Response(JSON.stringify({ 
        status: 'active',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - lastActivity) / 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    if (!acelleEndpoint) {
      debugLog("Point de terminaison Acelle manquant dans les en-têtes de la requête", null, true);
      return new Response(JSON.stringify({ error: 'Le point de terminaison Acelle est manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    // Construire l'URL de l'API Acelle avec l'authentification appropriée
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
    
    // Construire les paramètres d'URL - MAIS NE PAS INCLURE api_token dans l'URL
    // On utilise UNIQUEMENT Bearer Token pour l'authentification
    const queryParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'api_token' && key !== 'cache_key') {
        queryParams.append(key, value);
      }
    }

    let acelleApiUrl;
    if (resourceId) {
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}/${resourceId}?${queryParams.toString()}`;
    } else {
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
    }

    debugLog(`Transmission de la requête à l'API Acelle: ${acelleApiUrl}`);

    // Préparer les en-têtes UNIQUEMENT avec Bearer token
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`, // SEULE méthode d'authentification
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

      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Vérification de la redirection d'authentification
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
        debugLog(`La requête à ${acelleApiUrl} a expiré`, null, true);
        return new Response(JSON.stringify({ 
          error: 'La requête a expiré',
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
