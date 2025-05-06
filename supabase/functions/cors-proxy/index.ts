
// Ce fichier contient le code du proxy CORS amélioré pour l'application
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Configuration du proxy CORS
 */
const CONFIG = {
  version: "1.3.3",
  timeout: 60000, // 60 secondes
  userAgent: "Seventic-CORS-Proxy/1.3"
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
    
    // Ajouter notre user agent pour le suivi
    forwardHeaders['user-agent'] = CONFIG.userAgent;
    
    console.log("[CORS Proxy] En-têtes de la requête envoyée:", forwardHeaders);
    console.log("[CORS Proxy] Transmission de la requête vers:", targetUrl);
    
    // Effectuer la requête avec un timeout adapté
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const startTime = Date.now();
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: (req.method !== 'HEAD' && req.method !== 'GET') ? await req.blob() : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log("[CORS Proxy] Réponse cible:", `${response.status} ${response.statusText} pour ${targetUrl}`);
    
    // Obtenir le corps de la réponse
    const responseBody = response.headers.get('content-type')?.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);
    
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
    
    // Construire la réponse CORS
    const corsResponse = new Response(
      typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody,
      {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        }
      }
    );
    
    const endTime = Date.now();
    console.log("[CORS Proxy] Requête complétée en", `${endTime - startTime}ms pour ${targetUrl}`);
    
    return corsResponse;
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
