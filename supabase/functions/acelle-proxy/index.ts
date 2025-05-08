
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

// Configuration des niveaux de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Niveau de log par défaut
let currentLogLevel = LOG_LEVELS.INFO;

// Logger avec niveaux
function logMessage(message: string, data?: any, level: number = LOG_LEVELS.INFO) {
  if (level > currentLogLevel) return;
  
  const timestamp = new Date().toISOString();
  let levelName = "INFO";
  
  switch(level) {
    case LOG_LEVELS.ERROR:
      levelName = "ERROR";
      break;
    case LOG_LEVELS.WARN:
      levelName = "WARN";
      break;
    case LOG_LEVELS.INFO:
      levelName = "INFO";
      break;
    case LOG_LEVELS.DEBUG:
      levelName = "DEBUG";
      break;
    case LOG_LEVELS.TRACE:
      levelName = "TRACE";
      break;
  }
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    data: data !== undefined ? (typeof data === 'object' ? data : { value: data }) : undefined
  };
  
  if (level === LOG_LEVELS.ERROR) {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// Envoie un heartbeat aux 30 secondes pour indiquer que le service est actif
function startHeartbeat() {
  const interval = setInterval(() => {
    logMessage(`Heartbeat at ${new Date().toISOString()} - Service active`, {}, LOG_LEVELS.INFO);
  }, 30 * 1000);
  
  return interval;
}

// Handler principal pour toutes les requêtes
serve(async (req) => {
  // Configuration du niveau de log basée sur les headers
  const debugLevel = req.headers.get('x-debug-level');
  if (debugLevel && !isNaN(parseInt(debugLevel))) {
    currentLogLevel = parseInt(debugLevel);
  }
  
  // Pour les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Répondre à un ping pour vérifier que le service est actif
    if (req.url.endsWith('/ping')) {
      return new Response(
        JSON.stringify({ success: true, message: "Service actif", timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Récupérer l'URL de l'API et le token d'API à partir des headers
    const acelleToken = req.headers.get('x-acelle-token');
    let acelleEndpoint = req.headers.get('x-acelle-endpoint');
    
    if (!acelleToken || !acelleEndpoint) {
      logMessage("Headers d'authentification Acelle manquants", {}, LOG_LEVELS.ERROR);
      return new Response(
        JSON.stringify({ success: false, message: "Headers d'authentification Acelle requis" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Nettoyer l'URL de l'API (enlever le slash final si présent)
    acelleEndpoint = acelleEndpoint.replace(/\/$/, '');
    
    // Extraire le chemin de la requête (après acelle-proxy/)
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const apiPath = pathSegments.slice(pathSegments.indexOf('acelle-proxy') + 1).join('/');
    
    // Construire l'URL complète de l'API
    const apiUrl = `${acelleEndpoint}/${apiPath}`;
    
    // Ajouter le token API à l'URL
    const finalUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + `api_token=${acelleToken}`;
    
    // Masquer le token pour les logs
    const urlWithoutToken = apiUrl + (apiUrl.includes('?') ? '&' : '?') + `[token_masqué]`;
    
    // Ajouter des paramètres URL à partir de la requête originale
    const urlSearchParams = new URLSearchParams(url.search);
    let finalUrlWithParams = finalUrl;
    for (const [key, value] of urlSearchParams.entries()) {
      if (key !== 'api_token') { // Éviter la duplication du token
        finalUrlWithParams += `&${key}=${value}`;
      }
    }
    
    logMessage(`Transmission vers l'API Acelle avec authentication via paramètre URL`, {
      url_without_token: urlWithoutToken,
      auth_method: 'URL Parameter (api_token)',
      headers_auth_used: true
    }, LOG_LEVELS.INFO);
    
    // Préparer les headers pour la requête à l'API
    const apiHeaders = new Headers();
    apiHeaders.set('Accept', 'application/json');
    apiHeaders.set('Content-Type', 'application/json');
    apiHeaders.set('User-Agent', 'Seventic-Acelle-Proxy/1.0');
    apiHeaders.set('Authorization', `Bearer ${acelleToken}`); // Ajouter aussi en header pour compatibilité
    apiHeaders.set('X-API-TOKEN', acelleToken);
    
    // Copier certains headers de la requête originale
    ['cache-control', 'if-none-match', 'if-modified-since'].forEach(headerName => {
      const headerValue = req.headers.get(headerName);
      if (headerValue) {
        apiHeaders.set(headerName, headerValue);
      }
    });
    
    // Préparer les options de la requête
    const apiOptions: RequestInit = {
      method: req.method,
      headers: apiHeaders,
    };
    
    // Si la requête a un body, le copier
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      apiOptions.body = await req.text();
    }
    
    logMessage(`Envoi de requête à l'API Acelle`, {
      method: req.method,
      headers_sent: [...apiHeaders.keys()],
      has_body: apiOptions.body ? "Oui" : "Non"
    }, LOG_LEVELS.INFO);
    
    // Faire la requête à l'API
    const response = await fetch(finalUrlWithParams, apiOptions);
    
    // Récupérer les headers de la réponse
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/json');
    
    // Copier certains headers de la réponse
    ['etag', 'cache-control', 'last-modified'].forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    });
    
    if (!response.ok) {
      logMessage(`Réponse de l'API Acelle: ${response.status} ${response.statusText}`, {
        url_without_token: urlWithoutToken,
        status: response.status,
        status_text: response.statusText
      }, LOG_LEVELS.ERROR);
    } else {
      logMessage(`Réponse de l'API Acelle: ${response.status} OK`, {
        url_without_token: urlWithoutToken,
        status: response.status
      }, LOG_LEVELS.DEBUG);
    }
    
    // Renvoyer la réponse au client
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    logMessage(`Erreur lors de la transmission à l'API Acelle: ${error instanceof Error ? error.message : String(error)}`, { error }, LOG_LEVELS.ERROR);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Démarrer le heartbeat
const heartbeatInterval = startHeartbeat();

// S'assurer d'arrêter le heartbeat lorsque la fonction se termine
addEventListener("beforeunload", (event) => {
  clearInterval(heartbeatInterval);
});

// Enregistrer un log de démarrage
logMessage("Proxy Acelle démarré", { timestamp: new Date().toISOString() }, LOG_LEVELS.INFO);
