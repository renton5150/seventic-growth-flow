
// Ce fichier contient le code du proxy CORS amélioré pour l'application
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Configuration du proxy CORS
 */
const CONFIG = {
  version: "1.3.4", // Version incrémentée
  timeout: 120000, // 120 secondes (augmenté)
  userAgent: "Seventic-CORS-Proxy/1.3",
  maxRetries: 3,    // Nombre maximum de tentatives
  retryDelay: 1000  // Délai entre les tentatives en ms
};

console.log(`CORS Proxy v${CONFIG.version} démarré`);

serve(async (req) => {
  console.log("CORS Proxy activé");
  
  // Journaliser les requêtes
  const url = new URL(req.url);
  console.log(`Requête depuis ${req.headers.get("origin") || "unknown"} vers ${url.pathname}`);
  
  // Vérifier si c'est une requête preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log("[CORS Proxy] Traitement de la requête preflight OPTIONS");
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE"
      },
      status: 204
    });
  }
  
  try {
    // Extraire les paramètres de la requête
    const formData = await req.formData().catch(() => new FormData());
    const jsonBody = await req.json().catch(() => null);
    
    // Récupérer les informations sur la requête cible
    const targetUrl = formData.get('url') || url.searchParams.get('url') || jsonBody?.url;
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'URL manquante. Veuillez fournir une URL cible.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Transférer les en-têtes de la requête entrante, en filtrant ceux spécifiques à Cloudflare
    const headers = Object.fromEntries(req.headers.entries());
    const forwardHeaders = { ...headers };
    
    // Enlever les en-têtes spécifiques à Cloudflare
    delete forwardHeaders['cf-connecting-ip'];
    delete forwardHeaders['cf-ray'];
    delete forwardHeaders['cf-visitor'];
    delete forwardHeaders['x-forwarded-for'];
    delete forwardHeaders['x-forwarded-proto'];
    
    // Ajouter notre user agent et désactiver le cache
    forwardHeaders['user-agent'] = CONFIG.userAgent;
    forwardHeaders['cache-control'] = 'no-cache, no-store';
    forwardHeaders['pragma'] = 'no-cache';
    
    console.log("[CORS Proxy] En-têtes de la requête envoyée:", forwardHeaders);
    console.log("[CORS Proxy] Transmission de la requête vers:", targetUrl);
    
    // Fonction pour effectuer une requête avec retentatives
    const fetchWithRetry = async (url: string, options: RequestInit, retries = CONFIG.maxRetries): Promise<Response> => {
      try {
        return await fetch(url, options);
      } catch (error) {
        if (retries > 0) {
          console.log(`[CORS Proxy] Erreur, tentative ${CONFIG.maxRetries - retries + 1}/${CONFIG.maxRetries} dans ${CONFIG.retryDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
          return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
      }
    };
    
    // Effectuer la requête avec timeout adapté
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const startTime = Date.now();
    
    const response = await fetchWithRetry(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: (req.method !== 'HEAD' && req.method !== 'GET') ? await req.blob() : undefined,
      signal: controller.signal,
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    console.log("[CORS Proxy] Réponse cible:", `${response.status} ${response.statusText} pour ${targetUrl}`);
    
    // Obtenir le corps de la réponse
    let responseBody;
    let contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (e) {
        console.warn("[CORS Proxy] Échec de parsing JSON, traitement comme texte", e);
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }
    
    // Résumer la réponse reçue pour le débogage
    if (responseBody) {
      const contentLength = typeof responseBody === 'string' 
        ? responseBody.length 
        : JSON.stringify(responseBody).length;
        
      console.log("[CORS Proxy] Réponse reçue de l'API. Taille:", `${contentLength} caractères`);
      
      if (typeof responseBody === 'object') {
        const responsePreview = JSON.stringify(responseBody).substring(0, 500) + '...';
        console.log("[CORS Proxy] Aperçu de la réponse:", responsePreview);
      } else if (typeof responseBody === 'string' && responseBody.length < 1000) {
        console.log("[CORS Proxy] Aperçu de la réponse:", responseBody.substring(0, 500) + '...');
      }
    }
    
    // Construire les en-têtes de réponse avec CORS
    const responseHeaders = new Headers({
      ...corsHeaders,
      'Content-Type': contentType || 'application/json'
    });
    
    // Ajouter d'autres en-têtes pertinents de la réponse originale
    for (const [key, value] of response.headers.entries()) {
      if (!['content-type', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }
    
    // Ajouter un en-tête indiquant le temps de réponse
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    responseHeaders.set('X-Response-Time', `${responseTime}`);
    
    console.log("[CORS Proxy] Requête complétée en", `${responseTime}ms pour ${targetUrl}`);
    
    return new Response(
      typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody,
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      }
    );
  } catch (error) {
    console.error("[CORS Proxy] Erreur lors de la transmission de la requête:", error);
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur lors de la transmission de la requête: ${error.message}`,
        details: error.stack || 'Aucun détail disponible'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Indiquer le démarrage du serveur (pour le débogage)
console.log("Listening on http://localhost:9999/");
