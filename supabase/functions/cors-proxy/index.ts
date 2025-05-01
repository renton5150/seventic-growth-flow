
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration CORS complète pour tous les types de requêtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-auth-method, x-api-key, x-debug-level, x-wake-request, cache-control',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',  // 24 heures pour réduire les preflight
  'Access-Control-Expose-Headers': 'x-wake-request, x-debug-level, content-type, content-length',  // Exposer les en-têtes personnalisés
};

/**
 * Fonction principale de proxy CORS améliorée et fiabilisée
 */
serve(async (req) => {
  console.log(`[CORS Proxy] Requête reçue: ${req.method} ${req.url}`);
  const startTime = Date.now();
  
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
    
    // Récupération de tous les en-têtes requis de la requête originale
    const headers = new Headers();
    
    // Copier tous les en-têtes de la requête d'origine qui sont importants
    for (const [key, value] of req.headers.entries()) {
      // Filtrer les en-têtes qui ne doivent pas être transférés
      if (!['host', 'origin', 'referer', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    
    // En-têtes de base si non présents
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (!headers.has("User-Agent")) headers.set("User-Agent", "Seventic-Acelle-Proxy/2.2");
    
    // En-tête cache-control critique
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    
    // Options de la requête avec timeout
    const requestOptions: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(30000),  // 30 secondes de timeout
      redirect: 'follow'  // Suivre les redirections automatiquement
    };
    
    // Ajouter le corps pour les requêtes non-GET
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      try {
        // IMPORTANT: Utiliser req.clone() pour éviter "body already consumed"
        const reqClone = req.clone();
        const contentType = req.headers.get("Content-Type") || "";
        
        if (contentType.includes("application/json")) {
          const body = await reqClone.json();
          requestOptions.body = JSON.stringify(body);
        } else {
          const body = await reqClone.text();
          requestOptions.body = body;
        }
      } catch (error) {
        console.error("[CORS Proxy] Erreur lors de la lecture du corps de la requête:", error);
      }
    }
    
    // Log détaillé des en-têtes envoyés
    console.log("[CORS Proxy] En-têtes envoyés:", Object.fromEntries(headers.entries()));
    
    // Effectuer la requête vers la cible
    let response;
    
    try {
      response = await fetch(targetUrl, requestOptions);
    } catch (fetchError) {
      console.error(`[CORS Proxy] Erreur fetch:`, fetchError);
      
      return new Response(JSON.stringify({
        error: fetchError instanceof Error ? fetchError.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
        targetUrl,
        duration: Date.now() - startTime
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
    
    // Préparation des en-têtes de réponse
    const responseHeaders = new Headers(corsHeaders);
    
    // Copie des en-têtes non-CORS de la réponse cible
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        responseHeaders.set(key, value);
      }
    });
    
    // Assurer qu'un content-type est toujours défini
    if (!responseHeaders.has("Content-Type")) {
      responseHeaders.set("Content-Type", response.headers.get("Content-Type") || "application/json");
    }
    
    // Traiter les réponses 204 No Content séparément
    if (response.status === 204) {
      console.log("[CORS Proxy] Réponse 204 No Content");
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }
    
    // IMPORTANT: Cloner la réponse pour éviter "body already consumed"
    const responseClone = response.clone();
    
    // Traiter les contenus selon le Content-Type
    const contentType = response.headers.get("Content-Type") || "";
    
    // Essayer d'abord comme JSON pour les types applicaton/json
    if (contentType.includes("application/json")) {
      try {
        const responseData = await response.json();
        console.log("[CORS Proxy] Réponse JSON traitée avec succès");
        
        return new Response(JSON.stringify(responseData), {
          status: response.status,
          headers: responseHeaders
        });
      } catch (jsonError) {
        console.error("[CORS Proxy] Erreur lors de l'analyse JSON:", jsonError);
        
        // Si l'analyse JSON échoue, essayer comme texte
        try {
          const textData = await responseClone.text();
          console.log("[CORS Proxy] Réponse texte traitée: " + 
            (textData.length > 200 ? textData.substring(0, 200) + "..." : textData));
          
          // Si le texte ressemble à du JSON, essayer de le nettoyer
          if (textData.trim().startsWith('{') || textData.trim().startsWith('[')) {
            try {
              // Tenter de nettoyer et analyser le JSON
              const cleanedJson = JSON.parse(textData);
              return new Response(JSON.stringify(cleanedJson), {
                status: response.status,
                headers: responseHeaders
              });
            } catch (cleanError) {
              console.error("[CORS Proxy] Échec du nettoyage JSON:", cleanError);
              // Si le nettoyage échoue, renvoyer le texte brut
              return new Response(textData, {
                status: response.status,
                headers: responseHeaders
              });
            }
          } else {
            // Sinon renvoyer simplement comme texte
            return new Response(textData, {
              status: response.status,
              headers: responseHeaders
            });
          }
        } catch (textError) {
          console.error("[CORS Proxy] Erreur lors de la lecture de la réponse texte:", textError);
          return new Response(JSON.stringify({ 
            error: "Impossible de lire la réponse",
            originalUrl: targetUrl,
            status: response.status
          }), {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      }
    } else {
      // Pour les autres types de contenu, transférer directement comme texte
      try {
        const bodyText = await response.text();
        return new Response(bodyText, {
          status: response.status,
          headers: responseHeaders
        });
      } catch (error) {
        console.error("[CORS Proxy] Erreur lors de la lecture du corps:", error);
        return new Response(JSON.stringify({ 
          error: "Erreur lors de la lecture du corps de la réponse",
          originalUrl: targetUrl,
          status: response.status
        }), {
          status: response.status,
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
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
