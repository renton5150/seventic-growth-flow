
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { debugLog, LOG_LEVELS, determineLogLevel } from './logger.ts';
import { testEndpointAccess, testAuthMethods } from './api-tester.ts';
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
  
  // Ajuster le niveau de log en fonction des paramètres de requête
  const currentLogLevel = determineLogLevel(url, req.headers);
  
  // Support des différentes méthodes d'authentification
  const authHeader = req.headers.get('authorization');
  const acelleToken = req.headers.get('x-acelle-token');
  
  // Log les informations d'autorisation pour débogage
  if (authHeader) {
    debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...", LOG_LEVELS.DEBUG, currentLogLevel);
  } else if (acelleToken) {
    debugLog("Acelle token provided:", acelleToken.substring(0, 15) + "...", LOG_LEVELS.DEBUG, currentLogLevel);
  } else {
    debugLog("No explicit authorization provided", {}, LOG_LEVELS.WARN, currentLogLevel);
  }

  try {
    // Capture request start time for performance metrics
    const requestStartTime = Date.now();
    
    // Traitement spécial pour les requêtes ping/health check
    if (url.pathname.includes('ping')) {
      const pingResponse = await handlePingRequest(req, url, currentLogLevel);
      if (pingResponse) return pingResponse;
    }

    // Récupération de l'endpoint Acelle à partir des en-têtes ou des paramètres
    const acelleEndpoint = req.headers.get('x-acelle-endpoint') || url.searchParams.get('endpoint');
    
    if (!acelleEndpoint) {
      debugLog("Missing Acelle endpoint in request headers", {}, LOG_LEVELS.ERROR, currentLogLevel);
      return new Response(JSON.stringify({ 
        error: 'Acelle endpoint is missing',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    debugLog(`Received request to endpoint: ${acelleEndpoint} with method ${req.method}`, {
      params: Object.fromEntries(url.searchParams.entries())
    }, LOG_LEVELS.DEBUG, currentLogLevel);

    // Construire l'URL de l'API Acelle
    const acelleApiUrl = buildAcelleApiUrl(url, acelleEndpoint);
    
    debugLog(`Proxying request to Acelle API: ${acelleApiUrl}`, {}, LOG_LEVELS.DEBUG, currentLogLevel);

    // Préparer les en-têtes pour la requête à l'API Acelle
    const headers = buildRequestHeaders(req);

    // Transférer la requête à l'API Acelle avec un timeout
    try {
      const response = await sendRequestToAcelleApi(req, acelleApiUrl, headers, CONFIG.DEFAULT_TIMEOUT, currentLogLevel);
      
      // Traitement de la réponse
      const responseData = await processAcelleApiResponse(response, acelleApiUrl, requestStartTime, currentLogLevel);
      
      // Enregistrer la requête complétée pour les diagnostics
      const requestDuration = Date.now() - requestStartTime;
      debugLog("Request completed", { 
        status: response.status, 
        duration: requestDuration + "ms", 
        resource: getResourceFromUrl(url), 
        resourceId: getResourceIdFromUrl(url) 
      }, LOG_LEVELS.INFO, currentLogLevel);

      // Retourner la réponse avec tous les en-têtes CORS requis
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fetchError) {
      // Gérer les erreurs de requête
      if (fetchError.name === 'AbortError') {
        debugLog(`Request to ${acelleApiUrl} timed out`, { timeout: CONFIG.DEFAULT_TIMEOUT }, LOG_LEVELS.ERROR, currentLogLevel);
        return new Response(JSON.stringify({ 
          error: 'Request timed out', 
          endpoint: acelleEndpoint,
          url: acelleApiUrl,
          timeout: CONFIG.DEFAULT_TIMEOUT,
          timestamp: new Date().toISOString()
        }), { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error) {
    // Gestion globale des erreurs
    return handleGlobalError(error, currentLogLevel);
  }
});

/**
 * Traite les requêtes de ping et de vérification de santé
 */
async function handlePingRequest(req: Request, url: URL, currentLogLevel: number): Promise<Response | null> {
  if (req.url.includes('ping')) {
    debugLog("Received ping request - service is active", {}, LOG_LEVELS.INFO, currentLogLevel);
    
    // Check if it's a wake-up request
    const wakeParam = url.searchParams.get('wake');
    if (wakeParam === 'true') {
      debugLog("Wake-up request received, service is active", {}, LOG_LEVELS.INFO, currentLogLevel);
      return new Response(JSON.stringify({ 
        status: 'active', 
        message: 'Service is awake and ready',
        timestamp: new Date().toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Test API accessibility with extended debugging
    const baseUrl = url.searchParams.get('endpoint') || 'https://emailing.plateforme-solution.net/public/api/v1';
    
    const accessTest = await testEndpointAccess(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION} (Diagnostic)`,
        'Accept': 'application/json',
        'X-Debug-Marker': 'true'
      }
    });
    
    debugLog("API endpoint accessibility test:", accessTest, LOG_LEVELS.DEBUG, currentLogLevel);
    
    return new Response(JSON.stringify({ 
      status: 'active', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - heartbeatManager.getLastActivity()) / 1000),
      endpoint_test: accessTest,
      debug_level: currentLogLevel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return null;
}

/**
 * Construit l'URL de l'API Acelle à partir de l'URL de la requête et de l'endpoint
 */
function buildAcelleApiUrl(url: URL, acelleEndpoint: string): string {
  // Parse the URL path
  const parts = url.pathname.split('/');
  const resource = getResourceFromUrl(url);
  const resourceId = getResourceIdFromUrl(url);

  // Extract query parameters from the original URL
  const queryParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'endpoint') { // Skip our internal 'endpoint' parameter
      queryParams.append(key, value);
    }
  }

  // Build Acelle API URL
  // Make sure the endpoint doesn't end with a slash to properly join with the path
  const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
  
  // Check if the endpoint already contains the public/api/v1 path
  const apiPath = cleanEndpoint.includes('/public/api/v1') ? '' : 
                  cleanEndpoint.includes('/api/v1') ? '/public' : '/public/api/v1';
                  
  if (resourceId) {
    return `${cleanEndpoint}${apiPath}/${resource}/${resourceId}?${queryParams.toString()}`;
  } else {
    return `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
  }
}

/**
 * Extrait le nom de la ressource à partir de l'URL
 */
function getResourceFromUrl(url: URL): string {
  const parts = url.pathname.split('/');
  return parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
}

/**
 * Extrait l'ID de la ressource à partir de l'URL
 */
function getResourceIdFromUrl(url: URL): string | null {
  const parts = url.pathname.split('/');
  return parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];
}

/**
 * Construit les en-têtes pour la requête à l'API Acelle
 */
function buildRequestHeaders(req: Request): HeadersInit {
  // Set token auth as default per Acelle Mail documentation recommendation
  const authMethod = req.headers.get('x-auth-method') || 'token';
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'User-Agent': `Seventic-Acelle-Proxy/${CONFIG.VERSION}`,
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Auth-Method': authMethod
  };

  // Support explicite du token Acelle
  const acelleToken = req.headers.get('x-acelle-token');
  if (acelleToken) {
    headers['Authorization'] = `Bearer ${acelleToken}`;
    debugLog("Using Acelle token for authentication", {}, LOG_LEVELS.DEBUG, 5);
  }
  // Fallback sur l'en-tête d'autorisation standard
  else if (req.headers.get('authorization')) {
    headers['Authorization'] = req.headers.get('authorization');
  }

  // Only add Content-Type for requests with body
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
  }
  
  return headers;
}

/**
 * Envoie une requête à l'API Acelle avec gestion de timeout
 */
async function sendRequestToAcelleApi(
  req: Request, 
  acelleApiUrl: string, 
  headers: HeadersInit, 
  timeout: number,
  currentLogLevel: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Récupérer le body de la requête si nécessaire
    let requestBodyText = '';
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      requestBodyText = await req.text();
      debugLog("Request body (text):", requestBodyText, LOG_LEVELS.VERBOSE, currentLogLevel);
    }

    const response = await fetch(acelleApiUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBodyText,
      signal: controller.signal,
      redirect: 'follow' // Important: allow redirects to be followed automatically
    });

    clearTimeout(timeoutId);
    
    // Log the final URL after redirects
    debugLog(`Response URL after redirects: ${response.url}`, {}, LOG_LEVELS.DEBUG, currentLogLevel);

    // Check for redirects which indicate auth failure
    if (response.status === 302) {
      debugLog("Authentication failed - received redirect response", {}, LOG_LEVELS.ERROR, currentLogLevel);
      throw new Error("Authentication failed - invalid credentials or insufficient permissions");
    }

    // Handle server errors with retry mechanism
    if (response.status === 500) {
      debugLog("Server error from Acelle API", {}, LOG_LEVELS.ERROR, currentLogLevel);
      throw new Error("Internal Server Error from Acelle API");
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Traite la réponse de l'API Acelle
 */
async function processAcelleApiResponse(
  response: Response, 
  acelleApiUrl: string,
  requestStartTime: number,
  currentLogLevel: number
): Promise<any> {
  // Log the response status
  debugLog(`Acelle API response: ${response.status} ${response.statusText} for ${acelleApiUrl}`, {
    timeTaken: `${Date.now() - requestStartTime}ms`
  }, LOG_LEVELS.DEBUG, currentLogLevel);
  
  // Log response headers for debugging
  const responseHeadersObj: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeadersObj[key] = value;
  });
  debugLog("Response headers:", responseHeadersObj, LOG_LEVELS.DEBUG, currentLogLevel);

  // Read response data
  const data = await response.text();
  
  // Log raw response for full diagnostics
  debugLog("Raw response data:", 
    data.substring(0, 10000) + (data.length > 10000 ? "..." : ""), 
    LOG_LEVELS.VERBOSE, 
    currentLogLevel
  );
  
  try {
    const responseData = JSON.parse(data);
    debugLog(`Successfully parsed JSON response for ${acelleApiUrl}`, {}, LOG_LEVELS.DEBUG, currentLogLevel);
    
    // Log a sanitized sample of the response for debugging
    const sampleData = typeof responseData === 'object' ? 
      (Array.isArray(responseData) ? 
        responseData.slice(0, 2) : 
        responseData) : 
      responseData;
      
    debugLog("Response data sample:", 
      JSON.stringify(sampleData).substring(0, 1000) + "...", 
      LOG_LEVELS.DEBUG, 
      currentLogLevel);
      
    return responseData;
  } catch (e) {
    debugLog('Error parsing response from Acelle API:', e, LOG_LEVELS.ERROR, currentLogLevel);
    debugLog('Raw response data:', 
      data.substring(0, 1000) + (data.length > 1000 ? '...' : ''), 
      LOG_LEVELS.DEBUG, 
      currentLogLevel);
      
    return { 
      error: 'Failed to parse response from Acelle API', 
      status: response.status,
      message: data.substring(0, 2000),
      url: acelleApiUrl,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Gère les erreurs globales
 */
function handleGlobalError(error: any, currentLogLevel: number): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  debugLog('Error in Acelle Proxy:', { errorMessage, errorStack }, LOG_LEVELS.ERROR, currentLogLevel);
  
  // Réponses spécifiques pour certains types d'erreurs
  if (errorMessage.includes("Authentication failed")) {
    return new Response(JSON.stringify({
      error: "Authentication failed",
      message: "Invalid credentials or insufficient permissions",
      timestamp: new Date().toISOString()
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else if (errorMessage.includes("Internal Server Error")) {
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Le serveur Acelle Mail a rencontré une erreur interne. Veuillez réessayer plus tard.",
      retryAfter: 30,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '30'
      }
    });
  }
  
  // Réponse générique pour les autres erreurs
  return new Response(JSON.stringify({ 
    error: errorMessage,
    details: errorStack,
    timestamp: new Date().toISOString()
  }), { 
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
