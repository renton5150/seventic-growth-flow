
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCorsPreflightRequest, addCorsHeaders, createCorsErrorResponse } from './cors.ts';
import { HeartbeatManager } from './heartbeat.ts';
import { CONFIG } from './config.ts';

// Initialisation du client Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SERVICE_ROLE_KEY);

// Initialisation du gestionnaire de heartbeat
const heartbeatManager = new HeartbeatManager(
  CONFIG.SUPABASE_URL, 
  CONFIG.SERVICE_ROLE_KEY, 
  'acelle-proxy', 
  CONFIG.HEARTBEAT_INTERVAL
);

// Point d'entrée principal de la fonction edge
serve(async (req) => {
  // Update last activity time
  heartbeatManager.updateLastActivity();

  // Gérer les requêtes CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  // Récupération et analyse de l'URL
  const url = new URL(req.url);
  const requestStartTime = Date.now();
  
  try {
    // Traitement spécial pour les requêtes heartbeat/ping
    if (url.pathname.includes('/heartbeat') || url.pathname.includes('/ping')) {
      return new Response(JSON.stringify({ 
        status: 'active', 
        message: 'Service is awake and ready',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - heartbeatManager.getLastActivity()) / 1000)
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Récupération de l'endpoint Acelle à partir des en-têtes ou des paramètres
    const acelleEndpoint = req.headers.get('x-acelle-endpoint') || url.searchParams.get('endpoint');
    const acelleToken = req.headers.get('x-acelle-token');
    
    if (!acelleEndpoint) {
      console.error("Missing Acelle endpoint in request headers");
      return createCorsErrorResponse(400, 'Acelle endpoint is missing');
    }

    if (!acelleToken) {
      console.error("Missing Acelle token in request headers");
      return createCorsErrorResponse(400, 'Acelle token is missing');
    }

    // Extraire le chemin de l'API à partir de l'URL
    const pathParts = url.pathname.split('/');
    const apiPath = pathParts.slice(3).join('/'); // Ignorer /functions/v1/acelle-proxy/
    
    // Construire l'URL de l'API Acelle
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    const apiBasePath = cleanEndpoint.includes('/public/api/v1') ? '' : 
                       cleanEndpoint.includes('/api/v1') ? '/public' : '/public/api/v1';
    
    // URL finale pour l'API Acelle
    const acelleApiUrl = `${cleanEndpoint}${apiBasePath}/${apiPath}${url.search}`;
    
    console.log(`Proxying request to: ${acelleApiUrl}`);
    
    // Préparer les en-têtes pour la requête à l'API Acelle
    const headers = new Headers({
      'Accept': 'application/json',
      'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION}`,
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    // Ajouter l'en-tête d'autorisation de l'API
    headers.set('Authorization', `Bearer ${acelleToken}`);
    
    // Copier certains en-têtes spécifiques de la requête originale
    ['Content-Type', 'X-Request-ID'].forEach(header => {
      const value = req.headers.get(header);
      if (value) headers.set(header, value);
    });
    
    // Créer un contrôleur pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DEFAULT_TIMEOUT);
    
    try {
      // Lire le corps de la requête si nécessaire
      let requestBody = undefined;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBody = await req.text();
      }
      
      // Effectuer la requête à l'API Acelle
      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: requestBody,
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      // Log de la requête complétée
      const requestDuration = Date.now() - requestStartTime;
      console.log(`Request completed: ${response.status} in ${requestDuration}ms`);
      
      // Si la réponse indique une erreur d'authentification
      if (response.status === 401) {
        console.error("Authentication failed - 401 response");
        return createCorsErrorResponse(401, "Authentication failed - invalid API token");
      }
      
      // Lire le corps de la réponse
      const responseText = await response.text();
      let responseBody;
      
      // Tenter de parser le JSON si possible
      try {
        responseBody = JSON.parse(responseText);
      } catch (e) {
        // Si ce n'est pas du JSON, renvoyer le texte tel quel
        responseBody = { raw_response: responseText.substring(0, 1000) };
      }
      
      // Créer et renvoyer la réponse finale
      return new Response(JSON.stringify(responseBody), {
        status: response.status,
        headers: corsHeaders
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gérer les erreurs de timeout
      if (fetchError.name === 'AbortError') {
        console.error(`Request to ${acelleApiUrl} timed out`);
        return createCorsErrorResponse(504, 'Request timed out', {
          endpoint: acelleEndpoint,
          timeout: CONFIG.DEFAULT_TIMEOUT
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Global error in proxy:", error);
    
    // Renvoyer une réponse d'erreur générique
    return createCorsErrorResponse(500, 
      error instanceof Error ? error.message : "An unknown error occurred", 
      { stack: error instanceof Error ? error.stack : undefined }
    );
  }
});
