
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
  // Mettre à jour l'heure de dernière activité
  heartbeatManager.updateLastActivity();

  // Gérer les requêtes CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  // Récupération et analyse de l'URL
  const url = new URL(req.url);
  const requestStartTime = Date.now();
  const requestId = req.headers.get('x-request-id') || `req_${Date.now()}`;
  
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
    const acelleToken = req.headers.get('x-acelle-token') || url.searchParams.get('token');
    
    if (!acelleEndpoint) {
      console.error(`[${requestId}] Endpoint Acelle manquant dans les en-têtes`);
      return createCorsErrorResponse(400, 'Acelle endpoint is missing', { requestId });
    }

    if (!acelleToken) {
      console.error(`[${requestId}] Token Acelle manquant dans les en-têtes`);
      return createCorsErrorResponse(400, 'Acelle token is missing', { requestId });
    }

    // Extraire le chemin de l'API à partir de l'URL
    const pathParts = url.pathname.split('/');
    const apiPath = pathParts.slice(3).join('/'); // Ignorer /functions/v1/acelle-proxy/
    
    // Construire l'URL de l'API Acelle de manière robuste
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    
    // Logique améliorée pour détecter le bon chemin d'API
    let apiBasePath = '';
    
    if (!cleanEndpoint.includes('/api/v1') && !cleanEndpoint.includes('/public/api/v1')) {
      apiBasePath = '/api/v1';
    }
    
    // URL finale pour l'API Acelle
    const acelleApiUrl = `${cleanEndpoint}${apiBasePath}/${apiPath}${url.search}`;
    
    console.log(`[${requestId}] Proxying request to: ${acelleApiUrl.replace(acelleToken, '***')}`);
    
    // Préparer les en-têtes pour la requête à l'API Acelle
    const headers = new Headers({
      'Accept': 'application/json',
      'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION}`,
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    // Double méthode d'authentification pour maximiser la compatibilité
    headers.set('Authorization', `Bearer ${acelleToken}`);
    headers.set('X-Acelle-Token', acelleToken);
    
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
      console.log(`[${requestId}] Request completed: ${response.status} in ${requestDuration}ms`);
      
      // Si la réponse indique une erreur d'authentification
      if (response.status === 401 || response.status === 403) {
        console.error(`[${requestId}] Authentication failed - ${response.status} response`);
        return createCorsErrorResponse(response.status, "Authentication failed - invalid API token", {
          requestId,
          endpoint: cleanEndpoint
        });
      }
      
      // Lire le corps de la réponse
      const responseText = await response.text();
      let responseBody;
      
      // Tenter de parser le JSON si possible
      try {
        if (responseText && responseText.trim()) {
          responseBody = JSON.parse(responseText);
        } else {
          responseBody = { status: "success", message: "Empty response" };
        }
      } catch (e) {
        // Si ce n'est pas du JSON, renvoyer le texte tel quel
        responseBody = { raw_response: responseText.substring(0, 1000) };
      }
      
      // Ajouter des informations de débogage pour les réponses d'erreur
      if (response.status >= 400) {
        responseBody = {
          ...responseBody,
          _debug: {
            requestId,
            duration: requestDuration,
            apiUrl: acelleApiUrl.replace(acelleToken, '***'),
            method: req.method
          }
        };
      }
      
      // Créer et renvoyer la réponse finale
      return new Response(JSON.stringify(responseBody), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'X-Request-Duration': `${requestDuration}ms`,
          'X-Request-ID': requestId
        }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gérer les erreurs de timeout
      if (fetchError.name === 'AbortError') {
        console.error(`[${requestId}] Request to ${acelleApiUrl.replace(acelleToken, '***')} timed out`);
        return createCorsErrorResponse(504, 'Request timed out', {
          requestId,
          endpoint: acelleEndpoint,
          timeout: CONFIG.DEFAULT_TIMEOUT
        });
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error(`[${requestId}] Global error in proxy:`, error);
    
    // Renvoyer une réponse d'erreur générique
    return createCorsErrorResponse(500, 
      error instanceof Error ? error.message : "An unknown error occurred", 
      { 
        stack: error instanceof Error ? error.stack : undefined,
        requestId
      }
    );
  }
});
