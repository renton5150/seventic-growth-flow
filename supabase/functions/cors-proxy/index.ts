
/**
 * CORS Proxy Edge Function
 * 
 * Cette fonction sert de proxy CORS pour les requêtes vers des API tierces, permettant
 * de contourner les restrictions de Same-Origin Policy dans les navigateurs.
 * 
 * @version 1.3.2
 * @author Seventic Team
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configuration améliorée des en-têtes CORS avec support explicite pour une variété d'en-têtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, origin, accept, pragma, x-acelle-token, x-acelle-endpoint',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les requêtes preflight
  'Vary': 'Origin', // Important pour les CDNs et caches intermédiaires
  'Content-Type': 'application/json'
};

// Version actuelle du proxy CORS
const CORS_PROXY_VERSION = "1.3.2";
const DEFAULT_TIMEOUT = 30000; // 30 secondes de timeout par défaut

console.log("CORS Proxy v" + CORS_PROXY_VERSION + " démarré");

/**
 * Fonction principale du serveur CORS proxy
 */
serve(async (req: Request) => {
  console.log("CORS Proxy activé");
  
  // Capture des métriques de performance
  const requestStartTime = Date.now();
  
  // Récupération et analyse de l'origine pour le débogage CORS
  const origin = req.headers.get('origin');
  const requestUrl = new URL(req.url);
  console.log(`Requête depuis ${origin || 'inconnue'} vers ${requestUrl.pathname}`);
  
  // Configuration des en-têtes pour toutes les réponses avec gestion dynamique de l'origine
  const responseHeaders = new Headers(corsHeaders);
  
  // Si une origine spécifique est fournie, la refléter dans la réponse
  if (origin) {
    responseHeaders.set('Access-Control-Allow-Origin', origin);
  }
  
  try {
    // Gestion des requêtes OPTIONS preflight avec en-têtes CORS améliorés
    if (req.method === 'OPTIONS') {
      console.log("[CORS Proxy] Traitement de la requête preflight OPTIONS");
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }
    
    // Point de terminaison spécial /ping pour les vérifications de santé et les appels de réveil
    if (requestUrl.pathname.endsWith('/ping')) {
      console.log("[CORS Proxy] Requête ping reçue pour réveiller la fonction Edge");
      
      return new Response(
        JSON.stringify({
          status: "healthy",
          message: "CORS Proxy est en cours d'exécution",
          timestamp: new Date().toISOString(),
          version: CORS_PROXY_VERSION,
          received_origin: origin || 'aucune'
        }),
        {
          status: 200,
          headers: responseHeaders
        }
      );
    }
    
    // Récupération de l'URL cible depuis les paramètres de requête
    let targetUrl = requestUrl.searchParams.get('url');
    
    // Support pour les chemins d'API spécifiques comme /campaigns/{id}/stats
    if (!targetUrl && requestUrl.pathname.includes('/cors-proxy/')) {
      const pathSegments = requestUrl.pathname.split('/cors-proxy/');
      if (pathSegments.length > 1) {
        const apiPath = pathSegments[1];
        const acelleEndpoint = req.headers.get('x-acelle-endpoint') || 'https://emailing.plateforme-solution.net/api/v1';
        targetUrl = `${acelleEndpoint}/${apiPath}`;
        console.log(`[CORS Proxy] URL cible construite à partir du chemin: ${targetUrl}`);
      }
    }
    
    if (!targetUrl) {
      console.error("[CORS Proxy] Paramètre URL manquant");
      
      return new Response(
        JSON.stringify({ 
          error: "Paramètre URL manquant ou chemin API non reconnu", 
          usage: "Ajoutez ?url=https://votreapi.com/endpoint en tant que paramètre de requête ou utilisez /cors-proxy/chemin/api"
        }),
        {
          status: 400,
          headers: responseHeaders
        }
      );
    }
    
    console.log(`[CORS Proxy] Transmission de la requête vers: ${targetUrl}`);
    
    // Création d'une nouvelle requête avec la même méthode, en-têtes et corps
    const requestInit: RequestInit = {
      method: req.method,
      headers: new Headers()
    };
    
    // Liste des en-têtes à ignorer lors de la copie
    const headersToSkip = new Set(['host', 'connection']);
    
    // Liste des en-têtes Acelle spécifiques à transférer
    const acelleHeaders = ['x-acelle-token', 'x-acelle-key', 'x-acelle-endpoint', 'x-auth-method'];
    
    // Copie des en-têtes depuis la requête originale, en excluant ceux liés à CORS et à la connexion
    for (const [key, value] of req.headers.entries()) {
      if (!headersToSkip.has(key.toLowerCase())) {
        (requestInit.headers as Headers).set(key, value);
      }
    }
    
    // Gestion spéciale des en-têtes Acelle
    acelleHeaders.forEach(headerName => {
      const headerValue = req.headers.get(headerName);
      if (headerValue) {
        // Si c'est le token Acelle, l'ajouter comme paramètre d'URL
        if (headerName.toLowerCase() === 'x-acelle-token') {
          console.log(`[CORS Proxy] Ajout du token API Acelle comme paramètre d'URL`);
          const separator = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${separator}api_token=${headerValue}`;
          // Ne pas modifier les headers Authorization
        }
        // Conserver les autres en-têtes spécifiques à Acelle
        else {
          (requestInit.headers as Headers).set(headerName, headerValue);
        }
      }
    });
    
    // Ajout d'en-têtes d'identification pour notre proxy
    (requestInit.headers as Headers).set('User-Agent', 'Seventic-CORS-Proxy/1.3');
    (requestInit.headers as Headers).set('Referer', 'https://emailing.plateforme-solution.net/');
    
    // Copie du corps s'il est présent et si la méthode HTTP l'autorise
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.body) {
      requestInit.body = req.body;
    }
    
    // Utilisation d'AbortController pour implémenter un timeout sur la requête
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`[CORS Proxy] Timeout de la requête après ${DEFAULT_TIMEOUT/1000}s: ${targetUrl}`);
    }, DEFAULT_TIMEOUT);
    
    // Ajout du signal à la configuration de la requête
    requestInit.signal = controller.signal;
    
    try {
      // Exécution de la requête vers l'URL cible
      const fetchResponse = await fetch(targetUrl, requestInit);
      clearTimeout(timeoutId);
      
      // Copie des en-têtes depuis la réponse, en excluant les en-têtes CORS que nous définirons nous-mêmes
      for (const [key, value] of fetchResponse.headers.entries()) {
        if (!key.toLowerCase().startsWith('access-control-') && key.toLowerCase() !== 'content-length') {
          responseHeaders.set(key, value);
        }
      }
      
      // Préservation du type de contenu
      if (fetchResponse.headers.has('content-type')) {
        responseHeaders.set('Content-Type', fetchResponse.headers.get('content-type')!);
      }
      
      // Journalisation du statut de la réponse
      console.log(`[CORS Proxy] Réponse cible: ${fetchResponse.status} ${fetchResponse.statusText} pour ${targetUrl}`);
      
      // Lecture du corps de la réponse
      let responseBodyText = await fetchResponse.text();
      
      // Journalisation détaillée des réponses 404 pour le débogage
      if (fetchResponse.status === 404) {
        console.error(`[CORS Proxy] 404 Non trouvé: ${targetUrl}`);
        console.error(`[CORS Proxy] En-têtes de réponse:`, Object.fromEntries([...fetchResponse.headers]));
        console.error(`[CORS Proxy] Corps de la réponse (premiers 1000 caractères): ${responseBodyText.substring(0, 1000)}`);
      }
      
      // Déterminer si nous avons une réponse JSON à transformer
      const responseType = responseHeaders.get('Content-Type')?.includes('application/json') ? 'json' : 'text';
      
      // Transformation des réponses JSON si nécessaire
      if (responseType === 'json' && responseBodyText) {
        try {
          // Parser la réponse JSON
          const responseJson = JSON.parse(responseBodyText);
          
          // Vérifier si on a déjà une propriété data ou si on a un tableau à la racine
          if (!responseJson.data && (Array.isArray(responseJson) || Object.keys(responseJson).length > 0)) {
            console.log(`[CORS Proxy] Transformation de la réponse JSON pour compatibilité`);
            
            // Transformer pour wrapper dans data
            const transformedJson = {
              data: responseJson
            };
            
            // Log de la structure avant et après transformation (limité à 200 caractères)
            console.log(`[CORS Proxy] Structure avant transformation: ${JSON.stringify(responseJson).substring(0, 200)}`);
            console.log(`[CORS Proxy] Structure après transformation: ${JSON.stringify(transformedJson).substring(0, 200)}`);
            
            // Remplacer le corps de la réponse
            responseBodyText = JSON.stringify(transformedJson);
            console.log(`[CORS Proxy] Réponse transformée avec succès`);
          } else if (responseJson.data) {
            // La réponse a déjà une propriété 'data'
            console.log(`[CORS Proxy] La réponse contient déjà une propriété 'data', pas de transformation nécessaire`);
            if (Array.isArray(responseJson.data)) {
              console.log(`[CORS Proxy] Données trouvées, nombre d'éléments: ${responseJson.data.length}`);
            } else {
              console.log(`[CORS Proxy] Données trouvées (non-array)`);
            }
          }
          
          // Log des clés disponibles dans la réponse pour le débogage
          const topLevelKeys = Object.keys(responseJson);
          if (topLevelKeys.length > 0) {
            console.log(`[CORS Proxy] Clés disponibles dans la réponse: ${topLevelKeys.join(', ')}`);
          }
          
        } catch (error) {
          // En cas d'erreur de parsing, ne pas bloquer mais logger l'erreur
          console.log(`[CORS Proxy] Erreur lors de la transformation: ${error.message}`);
          console.log(`[CORS Proxy] Réponse non-JSON: ${responseBodyText.substring(0, 1000)}`);
        }
      }
      
      // Log de l'URL détaillée pour le débogage
      console.log(`[CORS Proxy] URL détaillée: ${targetUrl}`);
      
      // Calcul et journalisation de la durée totale de la requête
      const requestDuration = Date.now() - requestStartTime;
      console.log(`[CORS Proxy] Requête complétée en ${requestDuration}ms pour ${targetUrl}`);
      
      // Retour de la réponse proxy avec les en-têtes CORS
      return new Response(responseBodyText, {
        status: fetchResponse.status,
        headers: responseHeaders
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gestion spécifique des erreurs d'abandon (timeout)
      if (fetchError.name === 'AbortError') {
        console.error(`[CORS Proxy] La requête vers ${targetUrl} a expiré`, { timeout: DEFAULT_TIMEOUT });
        return new Response(JSON.stringify({ 
          error: 'La requête a expiré', 
          endpoint: targetUrl,
          timeout: `${DEFAULT_TIMEOUT/1000} secondes`,
          timestamp: new Date().toISOString()
        }), { 
          status: 504,
          headers: responseHeaders
        });
      }
      
      // Gestion des autres erreurs de requête
      console.error(`[CORS Proxy] Erreur lors de la requête vers ${targetUrl}:`, fetchError);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de la requête: ${fetchError.message}`,
        target: targetUrl,
        timestamp: new Date().toISOString()
      }), { 
        status: 500,
        headers: responseHeaders
      });
    }
  } catch (error) {
    // Gestion globale des erreurs
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[CORS Proxy] Erreur dans le proxy CORS:', { errorMessage, errorStack });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: responseHeaders
    });
  }
});
