
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint, x-debug-level, x-auth-method, path',
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

// Log initial pour vérifier que la fonction démarre correctement
logMessage("===== FONCTION ACELLE-PROXY DÉMARRÉE =====", {
  version: "1.6.0",
  timestamp: new Date().toISOString()
}, LOG_LEVELS.INFO);

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
    
    // Récupérer le chemin spécifique API depuis les paramètres d'URL ou le header
    const url = new URL(req.url);
    const apiPath = url.searchParams.get('path') || req.headers.get('path') || '';
    
    // Construire l'URL complète de l'API
    let apiUrl = `${acelleEndpoint}/${apiPath}`;
    
    // Si le chemin ne contient pas déjà /api/v1/, l'ajouter
    if (!apiPath.includes('/api/v1/')) {
      apiUrl = `${acelleEndpoint}/api/v1/${apiPath}`;
    }
    
    // Journaliser l'URL avant d'ajouter le token pour ne pas exposer le token dans les logs
    const urlForLogs = apiUrl;
    logMessage(`Requête API vers: ${urlForLogs}`, {
      method: req.method,
      headers_count: [...req.headers.keys()].length
    }, LOG_LEVELS.INFO);
    
    // Ajouter le token API à l'URL
    const finalUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + `api_token=${acelleToken}`;
    
    // Ajouter des paramètres URL à partir de la requête originale
    const urlSearchParams = new URLSearchParams(url.search);
    let finalUrlWithParams = finalUrl;
    for (const [key, value] of urlSearchParams.entries()) {
      if (key !== 'api_token' && key !== 'path') { // Éviter la duplication du token et du path
        finalUrlWithParams += `&${key}=${value}`;
      }
    }
    
    logMessage(`Transmission vers l'API Acelle avec authentification via paramètre URL`, {
      url_without_token: urlForLogs,
      auth_method: 'URL Parameter (api_token)',
      headers_auth_used: true
    }, LOG_LEVELS.INFO);
    
    // Préparer les headers pour la requête à l'API
    const apiHeaders = new Headers();
    apiHeaders.set('Accept', 'application/json');
    apiHeaders.set('Content-Type', 'application/json');
    apiHeaders.set('User-Agent', 'Seventic-Acelle-Proxy/1.7');
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
        responseHeaders.set(headerValue, headerName);
      }
    });
    
    if (!response.ok) {
      logMessage(`Réponse de l'API Acelle: ${response.status} ${response.statusText}`, {
        url_without_token: urlForLogs,
        status: response.status,
        status_text: response.statusText
      }, LOG_LEVELS.ERROR);
    } else {
      logMessage(`Réponse de l'API Acelle: ${response.status} OK`, {
        url_without_token: urlForLogs,
        status: response.status
      }, LOG_LEVELS.DEBUG);
    }
    
    // Récupérer la réponse sous forme de texte pour inspection et modification si nécessaire
    const responseText = await response.text();
    
    // Essayer de parser le JSON pour déboguer
    try {
      const responseJson = JSON.parse(responseText);
      logMessage("Réponse JSON reçue", {
        apiPath,
        status: response.status,
        dataKeys: Object.keys(responseJson)
      }, LOG_LEVELS.DEBUG);
      
      // Si c'est une campagne avec statistiques, loguer les statistiques
      if (apiPath.includes('/campaigns/') && apiPath.includes('/statistics')) {
        logMessage("Statistiques de campagne reçues", {
          uniq_open_rate: responseJson.uniq_open_rate || 'non défini',
          click_rate: responseJson.click_rate || 'non défini',
          keys: Object.keys(responseJson)
        }, LOG_LEVELS.INFO);
      }
    } catch (e) {
      // Ce n'est pas du JSON valide, ignorer silencieusement
    }
    
    // Renvoyer la réponse au client
    return new Response(responseText, {
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
  logMessage("Fonction acelle-proxy terminée", { reason: event.type }, LOG_LEVELS.INFO);
});
