
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { debugLog, LOG_LEVELS, determineLogLevel } from './logger.ts';
import { HeartbeatManager } from './heartbeat.ts';
import { CONFIG } from './config.ts';

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
  
  // Ajuster le niveau de log en fonction des paramètres de requête
  const currentLogLevel = determineLogLevel(url, req.headers);
  
  // Log les paramètres de requête importants pour le diagnostic
  debugLog(`Requête reçue: ${req.method} ${url.pathname}`, {
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'content-type': req.headers.get('content-type'),
      'authorization': req.headers.has('authorization') ? '***PRÉSENT***' : '***ABSENT***',
      'x-acelle-token': req.headers.has('x-acelle-token') ? '***PRÉSENT***' : '***ABSENT***',
      'x-acelle-endpoint': req.headers.get('x-acelle-endpoint')
    }
  }, LOG_LEVELS.INFO, currentLogLevel);
  
  try {
    // Récupérer les informations d'authentification de la requête
    const authHeader = req.headers.get('authorization') || '';
    const acelleToken = req.headers.get('x-acelle-token') || '';
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    
    // Validation de base des paramètres requis
    if (!acelleEndpoint) {
      return new Response(JSON.stringify({ 
        error: 'Endpoint Acelle manquant. Veuillez fournir l\'en-tête X-Acelle-Endpoint', 
        timestamp: new Date().toISOString() 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!acelleToken) {
      return new Response(JSON.stringify({ 
        error: 'Token Acelle manquant. Veuillez fournir l\'en-tête X-Acelle-Token',
        timestamp: new Date().toISOString() 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construire l'URL de l'API Acelle à partir du chemin de la requête
    // Pour éviter les problèmes de chemin en double
    const pathParts = url.pathname.split('/').filter(part => part && part !== 'acelle-proxy');
    const apiPath = pathParts.join('/');
    
    // Construire l'URL complète de l'API en vérifiant les doublons de segments
    const cleanEndpoint = acelleEndpoint.replace(/\/+$/, ''); // Supprimer les slashes à la fin
    
    // Vérifier si l'endpoint contient déjà le chemin public/api/v1
    const hasApiPath = cleanEndpoint.includes('/public/api/v1') || cleanEndpoint.includes('/api/v1');
    const apiBasePath = hasApiPath ? '' : '/public/api/v1';
    
    // Construire l'URL finale
    const apiUrl = `${cleanEndpoint}${apiBasePath}/${apiPath}`;
    
    // Inclure les paramètres de requête originaux
    const queryParams = new URLSearchParams(url.search);
    const apiUrlWithParams = `${apiUrl}${url.search ? url.search : ''}`;
    
    debugLog(`Transmission vers l'API Acelle: ${apiUrlWithParams}`, {}, LOG_LEVELS.INFO, currentLogLevel);
    
    // Préparer les en-têtes pour la requête à l'API Acelle
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION}`,
      // Utiliser le token Acelle dans l'en-tête plutôt que comme paramètre d'URL
      'Authorization': `Bearer ${acelleToken}`,
      // Ajouter également comme X-API-TOKEN pour la compatibilité
      'X-API-TOKEN': acelleToken
    };
    
    // Transférer la requête à l'API Acelle avec le bon en-tête d'authentification
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DEFAULT_TIMEOUT);
    
    try {
      // Récupérer le body de la requête si nécessaire
      let requestBodyText = '';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBodyText = await req.text();
      }
      
      // Exécuter la requête à l'API Acelle
      const response = await fetch(apiUrlWithParams, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBodyText,
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      // Journaliser la réponse
      debugLog(`Réponse de l'API Acelle: ${response.status} ${response.statusText}`, {
        url: apiUrlWithParams,
      }, response.ok ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR, currentLogLevel);
      
      // Lire et traiter la réponse
      const responseText = await response.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        debugLog("Réponse non-JSON reçue:", responseText.substring(0, 1000), LOG_LEVELS.WARN, currentLogLevel);
        responseData = { 
          raw_response: responseText.substring(0, 1000),
          parse_error: true
        };
      }
      
      // Ajouter des informations de diagnostic
      responseData = {
        ...responseData,
        _diagnostic: {
          status: response.status,
          timestamp: new Date().toISOString(),
          url: apiUrl
        }
      };
      
      // Retourner la réponse avec les en-têtes CORS
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (fetchError) {
      // Gérer les erreurs de timeout
      if (fetchError.name === 'AbortError') {
        debugLog(`Requête timeout: ${apiUrl}`, { timeout: CONFIG.DEFAULT_TIMEOUT }, LOG_LEVELS.ERROR, currentLogLevel);
        return new Response(JSON.stringify({
          error: 'Timeout de la requête',
          endpoint: acelleEndpoint,
          url: apiUrl,
          timeout: CONFIG.DEFAULT_TIMEOUT,
          timestamp: new Date().toISOString()
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError; // Re-throw pour le bloc catch externe
    }
    
  } catch (error) {
    // Journaliser et retourner l'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    debugLog("Erreur Edge Function:", errorMessage, LOG_LEVELS.ERROR, currentLogLevel);
    
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
