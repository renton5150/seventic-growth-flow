
// CORS Proxy pour Acelle Mail API
// Cette fonction sert d'intermédiaire entre le frontend et l'API Acelle Mail
// en contournant les restrictions CORS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration des en-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-acelle-token, x-auth-method, x-debug-level, x-wake-request',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

// Point d'entrée principal
serve(async (req) => {
  // Traiter les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    
    // Gérer les requêtes de ping pour vérifier le statut du service
    if (url.pathname.includes('/ping')) {
      console.log("Requête de ping reçue, service actif");
      return new Response(JSON.stringify({ 
        status: 'active', 
        message: 'CORS Proxy est actif et fonctionnel',
        timestamp: new Date().toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extraire le chemin cible de l'URL
    // Le chemin devrait être tout ce qui suit "/cors-proxy/"
    let targetPath = url.pathname.split('/cors-proxy/')[1];
    if (!targetPath) {
      return new Response(JSON.stringify({ 
        error: 'Chemin API manquant' 
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Récupérer les informations d'API depuis les en-têtes
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    const acelleToken = req.headers.get('x-acelle-token');

    if (!acelleEndpoint || !acelleToken) {
      return new Response(JSON.stringify({ 
        error: 'Informations d\'API Acelle manquantes dans les en-têtes',
        missingEndpoint: !acelleEndpoint,
        missingToken: !acelleToken
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Construire l'URL complète de l'API Acelle
    // Normaliser l'endpoint Acelle
    const baseEndpoint = acelleEndpoint.endsWith('/')
      ? acelleEndpoint.slice(0, -1)
      : acelleEndpoint;
      
    // Déterminer si l'URL contient déjà api/v1
    const apiPath = baseEndpoint.includes('/api/v1') ? '' : '/api/v1/';
    
    // Si le chemin cible contient déjà un '?', ajouter le token avec '&', sinon utiliser '?'
    const tokenSeparator = targetPath.includes('?') ? '&' : '?';
    
    // Construire l'URL finale
    let targetUrl = `${baseEndpoint}${apiPath}${targetPath}${tokenSeparator}api_token=${acelleToken}`;
    console.log(`URL cible construite à partir du chemin: ${targetUrl}`);
    
    // Transmettre la requête à l'API Acelle
    // Construire les en-têtes pour la requête à l'API
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventric-Acelle-Proxy/1.0',
    };
    
    // Ne pas ajouter Content-Type pour les requêtes GET ou OPTIONS
    if (!['GET', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Préparer les options pour la requête
    const requestOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: 'follow'
    };
    
    // Ajouter le corps de la requête si nécessaire
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.body) {
      const bodyText = await req.text();
      if (bodyText) {
        requestOptions.body = bodyText;
      }
    }

    // Envoi de la requête à l'API Acelle
    console.log(`Transmission de la requête vers: ${targetUrl}`);
    
    try {
      const apiResponse = await fetch(targetUrl, requestOptions);
      
      // Récupérer le contenu de la réponse
      const responseData = await apiResponse.text();
      
      // Tenter de parser en JSON pour le logging
      try {
        const jsonData = JSON.parse(responseData);
        console.log("Réponse API reçue:", {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          data: jsonData
        });
      } catch (e) {
        // Si ce n'est pas du JSON valide, on log juste le statut
        console.log("Réponse API reçue (non-JSON):", {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          length: responseData.length
        });
      }
      
      // Créer les en-têtes pour la réponse
      const responseHeaders = new Headers({ 
        ...corsHeaders,
        'Content-Type': apiResponse.headers.get('Content-Type') || 'application/json'
      });
      
      // Copier tous les en-têtes pertinents de la réponse d'origine
      apiResponse.headers.forEach((value, key) => {
        // Exclure les en-têtes qui pourraient causer des problèmes CORS
        if (!['access-control-allow-origin', 'access-control-allow-headers'].includes(key.toLowerCase())) {
          responseHeaders.set(key, value);
        }
      });
      
      // Renvoyer la réponse de l'API au client
      return new Response(responseData, {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: responseHeaders
      });
    } catch (apiError) {
      console.error("Erreur lors de la communication avec l'API Acelle:", apiError);
      return new Response(JSON.stringify({ 
        error: true, 
        message: `Erreur lors de la communication avec l'API Acelle: ${apiError.message}`,
        details: apiError.stack
      }), {
        status: 502, // Bad Gateway
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error("Erreur dans le proxy CORS:", error);
    
    // Retourner une réponse d'erreur
    return new Response(JSON.stringify({ 
      error: 'Erreur interne du proxy CORS',
      message: error.message || 'Une erreur s\'est produite lors du traitement de la requête',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
