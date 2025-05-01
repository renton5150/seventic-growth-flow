
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configuration du CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-auth-method, cache-control, x-wake-request",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

console.log("Listening on http://localhost:9999/");

serve(async (req) => {
  // Traiter les requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    console.log("[CORS Proxy] Traitement d'une requête OPTIONS (preflight)");
    return new Response(null, { headers: corsHeaders });
  }

  // Pour les requêtes ping spéciales pour réveiller l'Edge Function
  const url = new URL(req.url);
  if (url.pathname.endsWith('/ping')) {
    console.log("[CORS Proxy] Requête ping reçue pour réveiller l'Edge Function");
    return new Response(JSON.stringify({ 
      status: "healthy", 
      message: "CORS Proxy is running", 
      timestamp: new Date().toISOString() 
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });
  }

  // Extraire l'URL cible de la requête
  const targetUrl = url.searchParams.get("url");
  console.log(`[CORS Proxy] Requête reçue: ${req.method} ${req.url}`);

  if (!targetUrl) {
    console.error("[CORS Proxy] Erreur: Paramètre 'url' manquant");
    return new Response(JSON.stringify({
      error: "Missing required 'url' parameter"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    console.log(`[CORS Proxy] Redirection vers: ${targetUrl}`);
    
    // Préparer les en-têtes de la requête à transmettre
    const headers = new Headers();
    
    // Copier les en-têtes pertinents de la requête d'origine
    for (const [key, value] of req.headers.entries()) {
      // Ne pas transmettre certains en-têtes spécifiques à Supabase ou au proxy
      if (
        !key.toLowerCase().startsWith("cf-") &&
        !key.toLowerCase().startsWith("x-forwarded") &&
        key.toLowerCase() !== "host" &&
        key.toLowerCase() !== "connection"
      ) {
        headers.set(key, value);
      }
    }
    
    console.log(`[CORS Proxy] En-têtes envoyés: ${JSON.stringify(Object.fromEntries([...req.headers.entries()]), null, 2)}`);

    // Déterminer le corps de la requête à transmettre
    let proxyBody = null;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      proxyBody = await req.arrayBuffer();
    }

    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer la requête vers l'URL cible
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: proxyBody,
      redirect: "follow",
    });

    const responseTime = Date.now() - startTime;
    console.log(`[CORS Proxy] Réponse reçue: ${response.status} en ${responseTime}ms`);

    // Préparer les en-têtes de la réponse
    const responseHeaders = new Headers(corsHeaders);
    
    // Copier les en-têtes de la réponse originale
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "content-encoding" && !key.toLowerCase().startsWith("access-control")) {
        responseHeaders.set(key, value);
      }
    }

    // Obtenir le corps de la réponse
    const body = await response.arrayBuffer();

    // Log pour debugging
    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        console.log("[CORS Proxy] Réponse JSON traitée avec succès");
        // Ne pas logger le contenu de la réponse JSON pour éviter de surcharger les logs
      }
    } catch (e) {
      console.error("Error processing response:", e);
    }

    // Retourner la réponse
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[CORS Proxy] Erreur: ${error.message}`);
    
    return new Response(JSON.stringify({
      error: `Proxy error: ${error.message}`,
      details: error.stack || "No stack trace available"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
