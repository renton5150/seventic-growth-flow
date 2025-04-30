
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration des en-têtes CORS permissifs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-api-key'
};

// Serveur proxy
serve(async (req) => {
  const start = Date.now();
  console.log(`Requête proxy reçue: ${req.method} ${req.url}`);

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Extraire l'URL cible de la requête
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    
    if (!targetUrl) {
      console.error("URL cible manquante");
      return new Response(JSON.stringify({ error: "URL cible manquante dans les paramètres" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construire la requête vers l'API cible
    const targetReq = new Request(targetUrl, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
      redirect: 'follow'
    });

    // Nettoyer les en-têtes qui pourraient causer des problèmes
    const headersToRemove = ['host', 'origin', 'referer'];
    headersToRemove.forEach(header => targetReq.headers.delete(header));

    console.log(`Transfert de la requête vers: ${targetUrl}`);
    
    // Envoyer la requête à l'API cible avec un timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(targetReq, { signal: controller.signal });
    clearTimeout(timeout);

    // Construire la réponse avec les en-têtes CORS
    const responseBody = await response.blob();
    const proxyResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });

    // Ajouter les en-têtes CORS à la réponse
    Object.entries(corsHeaders).forEach(([key, value]) => {
      proxyResponse.headers.set(key, value);
    });

    // Logs
    const duration = Date.now() - start;
    console.log(`Réponse proxy envoyée: ${response.status} en ${duration}ms`);
    
    return proxyResponse;
  } catch (error) {
    console.error("Erreur dans le proxy CORS:", error);
    
    // Répondre avec une erreur
    return new Response(JSON.stringify({ 
      error: `Erreur de proxy: ${error.message || "Erreur inconnue"}`, 
      timestamp: new Date().toISOString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
