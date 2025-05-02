
/**
 * CORS Proxy Edge Function
 * 
 * Cette fonction sert de proxy CORS pour les requêtes vers des API tierces, permettant
 * de contourner les restrictions de Same-Origin Policy dans les navigateurs.
 * 
 * @version 1.2.0
 * @author Seventic Team
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configuration améliorée des en-têtes CORS avec support explicite pour une variété d'en-têtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-api-key, x-wake-request, origin, accept, pragma',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les requêtes preflight
  'Vary': 'Origin', // Important pour les CDNs et caches intermédiaires
  'Content-Type': 'application/json'
};

// Version actuelle du proxy CORS
const CORS_PROXY_VERSION = "1.2.0";
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
    const targetUrl = requestUrl.searchParams.get('url');
    
    if (!targetUrl) {
      console.error("[CORS Proxy] Paramètre URL manquant");
      
      return new Response(
        JSON.stringify({ 
          error: "Paramètre URL manquant", 
          usage: "Ajoutez ?url=https://votreapi.com/endpoint en tant que paramètre de requête"
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
    
    // Copie des en-têtes depuis la requête originale, en excluant ceux liés à CORS et à la connexion
    for (const [key, value] of req.headers.entries()) {
      if (!headersToSkip.has(key.toLowerCase())) {
        (requestInit.headers as Headers).set(key, value);
      }
    }
    
    // Ajout d'en-têtes d'identification pour notre proxy
    (requestInit.headers as Headers).set('User-Agent', 'Seventic-CORS-Proxy/1.2');
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
      const responseBody = await fetchResponse.text();
      
      // Journalisation détaillée des réponses 404 pour le débogage
      if (fetchResponse.status === 404) {
        console.error(`[CORS Proxy] 404 Non trouvé: ${targetUrl}`);
        console.error(`[CORS Proxy] En-têtes de réponse:`, Object.fromEntries([...fetchResponse.headers]));
        console.error(`[CORS Proxy] Corps de la réponse (premiers 1000 caractères): ${responseBody.substring(0, 1000)}`);
      }
      
      // Calcul et journalisation de la durée totale de la requête
      const requestDuration = Date.now() - requestStartTime;
      console.log(`[CORS Proxy] Requête complétée en ${requestDuration}ms pour ${targetUrl}`);
      
      // Retour de la réponse proxy avec les en-têtes CORS
      return new Response(responseBody, {
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
