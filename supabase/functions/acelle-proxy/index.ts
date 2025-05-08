
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
    },
    query_params: Object.fromEntries(url.searchParams.entries())
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
    
    // Inclure les paramètres de requête originaux et ajouter le token dans l'URL
    const queryParams = new URLSearchParams(url.search);
    
    // Important: Ajouter le token dans l'URL comme paramètre api_token
    // Cette méthode est préférée par l'API Acelle selon les tests curl
    queryParams.set('api_token', acelleToken);
    
    // Construire l'URL finale avec les paramètres
    const apiUrlWithParams = `${apiUrl}?${queryParams.toString()}`;
    
    debugLog(`Transmission vers l'API Acelle avec authentication via paramètre URL`, {
      url_without_token: `${apiUrl}?[token_masqué]&${queryParams.toString().replace(/api_token=[^&]+(&|$)/, '')}`,
      auth_method: 'URL Parameter (api_token)',
      headers_auth_used: true // On utilise aussi des en-têtes pour plus de compatibilité
    }, LOG_LEVELS.INFO, currentLogLevel);
    
    // Préparer les en-têtes pour la requête à l'API Acelle
    // On garde aussi l'authentification par en-tête pour plus de compatibilité
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION}`,
      // Utiliser le token Acelle dans l'en-tête aussi pour compatibilité
      'Authorization': `Bearer ${acelleToken}`,
      // Ajouter également comme X-API-TOKEN pour la compatibilité
      'X-API-TOKEN': acelleToken
    };
    
    // Transférer la requête à l'API Acelle avec le token dans l'URL ET les en-têtes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DEFAULT_TIMEOUT);
    
    try {
      // Récupérer le body de la requête si nécessaire
      let requestBodyText = '';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBodyText = await req.text();
      }
      
      debugLog(`Envoi de requête à l'API Acelle`, {
        method: req.method,
        headers_sent: Object.keys(headers),
        has_body: requestBodyText.length > 0 ? 'Oui' : 'Non'
      }, LOG_LEVELS.INFO, currentLogLevel);
      
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
        url_without_token: apiUrl,
        status: response.status,
        status_text: response.statusText
      }, response.ok ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR, currentLogLevel);
      
      // Lire et traiter la réponse
      const responseText = await response.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        debugLog("Réponse non-JSON reçue:", responseText.substring(0, 1000), LOG_LEVELS.WARN, currentLogLevel);
        
        // Si on reçoit un code 403, vérifier si c'est une page HTML d'erreur d'authentification
        if (response.status === 403 && responseText.includes('login') || responseText.includes('auth')) {
          responseData = { 
            error: "Erreur d'authentification: Le token API est invalide ou expiré",
            auth_error: true,
            raw_response_preview: responseText.substring(0, 200)
          };
        } else {
          responseData = { 
            raw_response: responseText.substring(0, 1000),
            parse_error: true
          };
        }
      }
      
      // Ajouter des informations de diagnostic
      responseData = {
        ...responseData,
        _diagnostic: {
          status: response.status,
          timestamp: new Date().toISOString(),
          url: apiUrl,
          auth_method_used: "URL Parameter (api_token)",
        }
      };
      
      // Gérer spécifiquement les erreurs 403 (Forbidden)
      if (response.status === 403) {
        debugLog(`Erreur d'authentification 403 détectée pour l'API Acelle`, {
          endpoint: acelleEndpoint,
          token_length: acelleToken ? acelleToken.length : 0
        }, LOG_LEVELS.ERROR, currentLogLevel);
        
        responseData = {
          ...responseData,
          auth_error: true,
          error: responseData.error || "Erreur d'authentification: vérifiez votre token API",
          auth_help: "Assurez-vous que votre token API est valide et actif dans le compte Acelle"
        };
      }
      
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
