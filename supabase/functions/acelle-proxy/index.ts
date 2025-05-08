
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
  version: "2.0.0", // Version incrémentée pour suivre les corrections des problèmes d'authentification
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
    
    // CORRECTION MAJEURE: Détection correcte des préfixes pour éviter la duplication
    
    // 1. Vérifier si l'endpoint contient déjà le préfixe /api/v1
    const hasApiPrefixInEndpoint = acelleEndpoint.includes('/api/v1');
    
    // 2. Vérifier si le chemin contient le préfixe /api/v1/
    const hasApiPrefixInPath = apiPath.startsWith('/api/v1/') || apiPath.startsWith('api/v1/');
    
    // 3. Nettoyer le chemin (supprimer le slash initial si présent)
    const cleanPath = apiPath.startsWith('/') ? apiPath.substring(1) : apiPath;
    
    // 4. Construire l'URL complète en évitant la duplication du préfixe
    let apiUrl;
    
    if (hasApiPrefixInEndpoint) {
      // Si l'endpoint contient déjà "/api/v1", nous ne l'ajoutons pas au chemin
      apiUrl = `${acelleEndpoint}/${cleanPath}`;
      logMessage(`URL avec endpoint contenant api/v1: ${apiUrl}`, { 
        endpoint: acelleEndpoint, 
        cleanPath: cleanPath 
      }, LOG_LEVELS.DEBUG);
    } else if (hasApiPrefixInPath) {
      // Si le chemin contient déjà le préfixe, on l'utilise tel quel
      apiUrl = `${acelleEndpoint}/${cleanPath}`;
      logMessage(`URL avec chemin contenant api/v1: ${apiUrl}`, { 
        endpoint: acelleEndpoint, 
        cleanPath: cleanPath 
      }, LOG_LEVELS.DEBUG);
    } else {
      // Sinon, ajouter le préfixe au chemin
      apiUrl = `${acelleEndpoint}/api/v1/${cleanPath}`;
      logMessage(`URL avec ajout du préfixe api/v1: ${apiUrl}`, { 
        endpoint: acelleEndpoint, 
        cleanPath: cleanPath 
      }, LOG_LEVELS.DEBUG);
    }
    
    // Journaliser l'URL avant d'ajouter le token pour ne pas exposer le token dans les logs
    const urlForLogs = apiUrl;
    logMessage(`Requête API vers: ${urlForLogs}`, {
      method: req.method,
      headers_count: [...req.headers.keys()].length,
      path: apiPath,
      has_prefix_in_endpoint: hasApiPrefixInEndpoint,
      has_prefix_in_path: hasApiPrefixInPath
    }, LOG_LEVELS.INFO);
    
    // Ajouter le token API à l'URL - MODIFICATION: Placer le token en premier paramètre
    // Cette modification semble triviale mais peut être importante pour certaines API qui
    // vérifient spécifiquement la position du token dans l'URL
    const finalUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + `api_token=${acelleToken}`;
    
    // Ajouter des paramètres URL à partir de la requête originale
    const urlSearchParams = new URLSearchParams(url.search);
    let finalUrlWithParams = finalUrl;
    for (const [key, value] of urlSearchParams.entries()) {
      if (key !== 'api_token' && key !== 'path') { // Éviter la duplication du token et du path
        finalUrlWithParams += `&${key}=${value}`;
      }
    }
    
    // Ajouter un paramètre anti-cache
    const timestamp = Date.now();
    finalUrlWithParams += `&_t=${timestamp}`;
    
    logMessage(`Transmission vers l'API Acelle avec authentification via paramètre URL`, {
      url_without_token: urlForLogs,
      auth_method: 'URL Parameter (api_token)',
      headers_auth_used: true
    }, LOG_LEVELS.INFO);
    
    // Préparer les headers pour la requête à l'API
    const apiHeaders = new Headers();
    apiHeaders.set('Accept', 'application/json');
    apiHeaders.set('Content-Type', 'application/json');
    apiHeaders.set('User-Agent', 'Seventic-Acelle-Proxy/2.0');
    
    // MODIFICATION: Ajouter plusieurs méthodes d'authentification pour augmenter les chances de succès
    apiHeaders.set('Authorization', `Bearer ${acelleToken}`); // Méthode 1: Bearer token
    apiHeaders.set('X-API-TOKEN', acelleToken);              // Méthode 2: Header X-API-TOKEN
    apiHeaders.set('API-Token', acelleToken);                // Méthode 3: Header API-Token
    apiHeaders.set('Api-Token', acelleToken);                // Méthode 4: Header Api-Token (casse différente)
    apiHeaders.set('X-Acelle-Token', acelleToken);           // Méthode 5: Header X-Acelle-Token personnalisé
    
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
    
    logMessage(`Envoi de requête à l'API Acelle avec méthodes d'authentification multiples`, {
      method: req.method,
      headers_sent: [...apiHeaders.keys()],
      has_body: apiOptions.body ? "Oui" : "Non",
      final_url: urlForLogs // Log de l'URL sans le token
    }, LOG_LEVELS.INFO);
    
    // Faire la requête à l'API avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    apiOptions.signal = controller.signal;
    
    try {
      const response = await fetch(finalUrlWithParams, apiOptions);
      clearTimeout(timeoutId); // Annuler le timeout si la requête a réussi
      
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
      
      // NOUVEAU: Gestion améliorée pour l'erreur 403
      if (response.status === 403) {
        logMessage(`Erreur d'authentification (403 Forbidden) pour l'URL: ${urlForLogs}`, {
          url_finale: urlForLogs,
          auth_headers_sent: {
            'Authorization': 'Bearer ***MASQUÉ***',
            'X-API-TOKEN': '***MASQUÉ***',
            'API-Token': '***MASQUÉ***',
            'X-Acelle-Token': '***MASQUÉ***'
          },
          auth_method_in_url: 'api_token=***MASQUÉ***'
        }, LOG_LEVELS.ERROR);
        
        // Tentative de diagnostic pour les erreurs 403
        let responseBody = "";
        try {
          responseBody = await response.text();
        } catch (e) {
          logMessage("Impossible de lire le corps de la réponse d'erreur 403", { error: e }, LOG_LEVELS.ERROR);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Erreur d'authentification à l'API Acelle (403 Forbidden)",
            details: {
              responseBody: responseBody || "Pas de corps de réponse disponible",
              auth_methods_tried: [
                "URL Parameter (api_token=)",
                "Bearer Authorization Header",
                "X-API-TOKEN Header",
                "API-Token Header",
                "X-Acelle-Token Header"
              ],
              suggested_checks: [
                "Vérifiez que le token API est toujours valide et actif",
                "Connectez-vous à l'interface web Acelle pour confirmer que les identifiants fonctionnent",
                "Vérifiez si le compte n'a pas de restrictions IP ou de permissions limitées",
                "Essayez de régénérer le token API depuis l'interface admin d'Acelle"
              ]
            },
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
      
      // NOUVEAU: Gestion améliorée pour l'erreur 404
      if (response.status === 404) {
        logMessage(`Ressource non trouvée (404) pour l'URL: ${urlForLogs}`, {
          url_finale: urlForLogs,
          path_original: apiPath,
          has_prefix_in_endpoint: hasApiPrefixInEndpoint,
          has_prefix_in_path: hasApiPrefixInPath,
          full_url_analyzed: finalUrlWithParams.replace(acelleToken, "API_TOKEN_MASKED")
        }, LOG_LEVELS.ERROR);
        
        // Tentative de diagnostic pour les erreurs 404
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Ressource non trouvée (404)",
            details: {
              path: apiPath,
              has_api_prefix_in_endpoint: hasApiPrefixInEndpoint,
              has_api_prefix_in_path: hasApiPrefixInPath,
              endpoint_base: acelleEndpoint,
              suggested_checks: [
                "Vérifiez que le chemin d'API est correct",
                "Vérifiez que la ressource existe dans votre version d'Acelle",
                "Vérifiez que l'endpoint de base est correct et n'inclut pas déjà /api/v1",
                "Essayez d'appeler un endpoint plus simple comme 'me' pour tester la connexion"
              ]
            },
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
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
          
          // NOUVEAU: Ajouter une correction spécifique pour les statistiques de campagnes
          // Si les statistiques sont dans un format inattendu, essayer de les normaliser
          if (responseJson.statistics && !responseJson.uniq_open_rate) {
            logMessage("Correction du format des statistiques de campagne", { 
              original_format: Object.keys(responseJson)
            }, LOG_LEVELS.INFO);
            
            // Si les statistiques sont nichées dans un sous-objet, remonter les valeurs
            const correctedResponse = { ...responseJson.statistics, uid: responseJson.uid || responseJson.campaign_uid };
            return new Response(JSON.stringify(correctedResponse), {
              status: response.status,
              headers: responseHeaders
            });
          }
        }
      } catch (e) {
        // Ce n'est pas du JSON valide, ignorer silencieusement
      }
      
      // Renvoyer la réponse au client
      return new Response(responseText, {
        status: response.status,
        headers: responseHeaders
      });
    } catch (fetchError) {
      // Gérer les erreurs de fetch spécifiquement
      clearTimeout(timeoutId);
      
      // Déterminer si c'est une erreur de timeout
      const isTimeout = fetchError.name === 'AbortError';
      const errorMessage = isTimeout 
        ? "Timeout: La requête vers l'API Acelle a pris trop de temps" 
        : `Erreur de connexion: ${fetchError.message}`;
      
      logMessage(errorMessage, { 
        error: String(fetchError),
        isTimeout,
        url: urlForLogs 
      }, LOG_LEVELS.ERROR);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          isTimeout,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: isTimeout ? 504 : 502 // 504 Gateway Timeout ou 502 Bad Gateway
        }
      );
    }
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
