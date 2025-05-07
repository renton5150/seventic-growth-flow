
// CORS Proxy pour Acelle Mail API
// Cette fonction sert d'intermédiaire entre le frontend et l'API Acelle Mail
// en contournant les restrictions CORS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration des en-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-endpoint, x-acelle-token, x-auth-method, x-debug-level, x-wake-request, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
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
    const startTime = Date.now();
    
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
    const requestId = req.headers.get('x-request-id') || `req_${Date.now()}`;

    if (!acelleEndpoint || !acelleToken) {
      return new Response(JSON.stringify({ 
        error: 'Informations d\'API Acelle manquantes dans les en-têtes',
        missingEndpoint: !acelleEndpoint,
        missingToken: !acelleToken,
        requestId
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[${requestId}] Traitement de la requête: ${targetPath}`);
    
    // Construire l'URL complète de l'API Acelle
    // Normaliser l'endpoint Acelle
    const baseEndpoint = acelleEndpoint.endsWith('/')
      ? acelleEndpoint.slice(0, -1)
      : acelleEndpoint;
    
    // Déterminer si l'URL contient déjà api/v1
    const defaultApiPath = '/api/v1/';
    let apiPath = '';
    
    if (!baseEndpoint.includes('/api/v1')) {
      apiPath = defaultApiPath;
    }
    
    // Si le chemin cible contient déjà un '?', ajouter le token avec '&', sinon utiliser '?'
    const tokenSeparator = targetPath.includes('?') ? '&' : '?';
    
    // Construire l'URL finale
    let targetUrl = `${baseEndpoint}${apiPath}${targetPath}${tokenSeparator}api_token=${acelleToken}`;
    console.log(`[${requestId}] URL cible construite: ${targetUrl.replace(acelleToken, '***')}`);
    
    // Transmettre la requête à l'API Acelle
    // Construire les en-têtes pour la requête à l'API
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventric-Acelle-Proxy/2.0',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Request-ID': requestId
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
      try {
        const bodyText = await req.text();
        if (bodyText) {
          requestOptions.body = bodyText;
        }
      } catch (bodyError) {
        console.error(`[${requestId}] Erreur lors de la lecture du corps de la requête:`, bodyError);
      }
    }

    // Créer un signal de timeout pour éviter les requêtes bloquantes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes max
    requestOptions.signal = controller.signal;

    // Envoi de la requête à l'API Acelle
    console.log(`[${requestId}] Transmission de la requête vers l'API...`);
    
    try {
      const apiResponse = await fetch(targetUrl, requestOptions);
      clearTimeout(timeoutId);
      
      // Récupérer le contenu de la réponse
      const responseData = await apiResponse.text();
      const duration = Date.now() - startTime;
      
      // Analyser pour le logging
      let jsonData = null;
      let isJson = false;
      
      // Tenter de parser en JSON pour le logging
      try {
        jsonData = JSON.parse(responseData);
        isJson = true;
        
        console.log(`[${requestId}] Réponse API reçue en ${duration}ms:`, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          data: jsonData
        });
      } catch (e) {
        // Si ce n'est pas du JSON valide, on log juste le statut
        console.log(`[${requestId}] Réponse API reçue (non-JSON) en ${duration}ms:`, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          length: responseData.length
        });
      }
      
      // Créer les en-têtes pour la réponse
      const responseHeaders = new Headers({ 
        ...corsHeaders,
        'Content-Type': apiResponse.headers.get('Content-Type') || 'application/json',
        'X-Request-Duration': `${duration}ms`,
        'X-Request-ID': requestId
      });
      
      // Copier tous les en-têtes pertinents de la réponse d'origine
      apiResponse.headers.forEach((value, key) => {
        // Exclure les en-têtes qui pourraient causer des problèmes CORS
        const excludedHeaders = [
          'access-control-allow-origin', 
          'access-control-allow-headers', 
          'content-encoding',
          'content-length',
          'connection'
        ];
        
        if (!excludedHeaders.includes(key.toLowerCase())) {
          responseHeaders.set(key, value);
        }
      });
      
      // Renvoyer la réponse avec les données au format approprié
      if (isJson) {
        return new Response(JSON.stringify(jsonData), {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } else {
        // Pour les réponses non-JSON, renvoyer tel quel
        return new Response(responseData, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      }
    } catch (apiError) {
      clearTimeout(timeoutId);
      
      console.error(`[${requestId}] Erreur lors de la communication avec l'API Acelle:`, apiError);
      
      // Vérifier si c'est une erreur de timeout
      if (apiError.name === 'AbortError') {
        return new Response(JSON.stringify({ 
          error: true, 
          message: `Délai d'attente dépassé lors de la communication avec l'API Acelle`,
          requestId
        }), {
          status: 504, // Gateway Timeout
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: true, 
        message: `Erreur lors de la communication avec l'API Acelle: ${apiError.message}`,
        details: apiError.stack,
        requestId
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
