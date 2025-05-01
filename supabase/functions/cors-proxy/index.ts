
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration CORS complète pour tous les types de requêtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-auth-method, x-api-key, x-debug-level, x-wake-request, cache-control',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',  // 24 heures pour réduire les preflight
  'Access-Control-Expose-Headers': 'x-wake-request, x-debug-level',  // Exposer les en-têtes personnalisés
};

/**
 * Fonction principale de proxy CORS
 */
serve(async (req) => {
  console.log(`[CORS Proxy] Requête reçue: ${req.method} ${req.url}`);
  
  // Gérer les requêtes preflight OPTIONS avec une réponse immédiate
  if (req.method === "OPTIONS") {
    console.log("[CORS Proxy] Traitement d'une requête OPTIONS (preflight)");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    
    // Validation de l'URL cible
    if (!targetUrl) {
      console.error("[CORS Proxy] Erreur: Paramètre 'url' manquant");
      return new Response(JSON.stringify({ 
        error: "Paramètre 'url' manquant", 
        timestamp: new Date().toISOString() 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    console.log(`[CORS Proxy] Redirection vers: ${targetUrl}`);
    
    // Récupération des en-têtes requis de la requête originale
    const headers = new Headers();
    headers.set("Accept", req.headers.get("Accept") || "application/json");
    headers.set("Content-Type", req.headers.get("Content-Type") || "application/json");
    headers.set("User-Agent", "Seventic-Acelle-Proxy/2.0");
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    
    // Copie des en-têtes spécifiques à Acelle avec vérification de leur existence
    ["Authorization", "x-acelle-endpoint", "x-auth-method", "x-api-key", 
     "x-debug-level", "x-wake-request"].forEach(header => {
      const value = req.headers.get(header);
      if (value) headers.set(header, value);
    });
    
    // Options de la requête avec timeout
    const requestOptions = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(30000)  // 30 secondes de timeout
    };
    
    // Ajouter le corps pour les requêtes POST/PUT avec copie sécurisée
    if (["POST", "PUT"].includes(req.method)) {
      try {
        // Cloner la requête pour pouvoir la lire sans la consommer
        const contentType = req.headers.get("Content-Type") || "";
        
        // Utiliser la méthode adaptée en fonction du Content-Type
        if (contentType.includes("application/json")) {
          const reqClone = req.clone();
          const body = await reqClone.json();
          requestOptions.body = JSON.stringify(body);
        } else {
          const reqClone = req.clone();
          const body = await reqClone.text();
          requestOptions.body = body;
        }
      } catch (error) {
        console.error("[CORS Proxy] Erreur lors de la lecture du corps de la requête:", error);
      }
    }
    
    console.log("[CORS Proxy] En-têtes envoyés:", Object.fromEntries(headers.entries()));
    
    // Effectuer la requête avec gestion des erreurs
    const startTime = Date.now();
    let response;
    
    try {
      response = await fetch(targetUrl, requestOptions);
    } catch (fetchError) {
      console.error(`[CORS Proxy] Erreur fetch:`, fetchError);
      
      return new Response(JSON.stringify({
        error: fetchError instanceof Error ? fetchError.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
        targetUrl
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[CORS Proxy] Réponse reçue: ${response.status} en ${duration}ms`);
    
    // Préparation des en-têtes de réponse avec CORS
    const responseHeaders = new Headers(corsHeaders);
    
    // Copie des en-têtes importants de la réponse cible
    ["Content-Type", "Content-Disposition", "Cache-Control", "ETag"].forEach(header => {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    });
    
    // Traiter les réponses 204 No Content séparément
    if (response.status === 204) {
      console.log("[CORS Proxy] Réponse 204 No Content");
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }
    
    // CRITIQUE: Cloner la réponse avant de tenter de lire son corps
    const responseToProcess = response.clone();
    
    try {
      // D'abord essayer de traiter comme JSON
      const responseData = await responseToProcess.json();
      console.log("[CORS Proxy] Réponse JSON traitée avec succès");
      
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: responseHeaders
      });
    } catch (jsonError) {
      // Si ce n'est pas du JSON, essayer comme texte
      try {
        const textData = await response.text();
        console.log("[CORS Proxy] Réponse texte traitée");
        
        return new Response(textData, {
          status: response.status,
          headers: responseHeaders
        });
      } catch (textError) {
        console.error("[CORS Proxy] Erreur lors de la lecture de la réponse:", textError);
        return new Response(JSON.stringify({ error: "Impossible de lire la réponse" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
  } catch (error) {
    console.error("[CORS Proxy] Erreur globale:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
