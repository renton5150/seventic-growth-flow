
// CORS Proxy pour Acelle Mail API avec gestion robuste des erreurs
// Supporte plusieurs méthodes d'authentification et implémente un système
// de heartbeat amélioré pour éviter les shutdowns

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HeartbeatManager } from './heartbeat.ts';
import { CONFIG } from './config.ts';

// Initialisation du gestionnaire de heartbeat
const heartbeatManager = new HeartbeatManager(
  CONFIG.SUPABASE_URL, 
  CONFIG.SERVICE_ROLE_KEY, 
  'cors-proxy', 
  CONFIG.HEARTBEAT_INTERVAL
);

// Configuration des en-têtes CORS
const corsHeaders = CONFIG.CORS_HEADERS;

// Point d'entrée principal
serve(async (req) => {
  // Mettre à jour l'heure de dernière activité
  heartbeatManager.updateLastActivity();

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
    const requestId = req.headers.get('x-request-id') || `req_${Date.now()}`;
    
    // Gérer les requêtes de ping pour vérifier le statut du service
    if (url.pathname.includes('/ping')) {
      console.log(`[${requestId}] Requête de ping reçue, service actif depuis ${Math.floor(heartbeatManager.getUptime() / 1000)}s`);
      return new Response(JSON.stringify({ 
        status: 'active', 
        message: 'CORS Proxy est actif et fonctionnel',
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(heartbeatManager.getUptime() / 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extraire le chemin cible de l'URL
    let targetPath = url.pathname.split('/cors-proxy/')[1];
    if (!targetPath) {
      return new Response(JSON.stringify({ 
        error: 'Chemin API manquant',
        requestId
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Récupérer les informations d'API depuis les en-têtes
    const acelleEndpoint = req.headers.get('x-acelle-endpoint');
    const acelleToken = req.headers.get('x-acelle-token');
    
    // Vérification des informations nécessaires
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
    
    // Normaliser l'endpoint Acelle pour éviter les problèmes de double slash
    const baseEndpoint = acelleEndpoint.endsWith('/')
      ? acelleEndpoint.slice(0, -1)
      : acelleEndpoint;
    
    // Support intelligent pour différentes structures d'API
    // Détecter si l'URL contient déjà api/v1
    const hasApiV1 = baseEndpoint.includes('/api/v1');
    const hasPublicApiV1 = baseEndpoint.includes('/public/api/v1');
    
    let apiPath = '';
    
    if (!hasApiV1 && !hasPublicApiV1) {
      // Ajouter le chemin par défaut si aucun présent
      apiPath = '/api/v1/';
    }
    
    // Si le chemin cible contient déjà un '?', ajouter le token avec '&', sinon utiliser '?'
    const tokenSeparator = targetPath.includes('?') ? '&' : '?';
    
    // Construire l'URL finale avec le token comme paramètre de requête
    let targetUrl = `${baseEndpoint}${apiPath}${targetPath}${tokenSeparator}api_token=${acelleToken}`;
    console.log(`[${requestId}] URL cible construite: ${targetUrl.replace(acelleToken, '***')}`);
    
    // Transmettre la requête à l'API Acelle
    // Construire les en-têtes pour la requête à l'API
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventric-Acelle-Proxy/2.1',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Request-ID': requestId
    };
    
    // Gérer le Content-Type de manière appropriée selon la méthode HTTP
    if (!['GET', 'OPTIONS'].includes(req.method)) {
      const contentType = req.headers.get('Content-Type') || 'application/json';
      headers['Content-Type'] = contentType;
    }
    
    // Ajouter l'authentification API dans le header aussi (en plus de l'URL)
    // pour une compatibilité maximale avec différentes configurations Acelle
    headers['X-Acelle-Token'] = acelleToken;
    
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
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DEFAULT_TIMEOUT);
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
      
      // Tenter de parser en JSON pour le logging et la réponse
      try {
        if (responseData && responseData.trim()) {
          jsonData = JSON.parse(responseData);
          isJson = true;
          
          console.log(`[${requestId}] Réponse API reçue en ${duration}ms:`, {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            dataPreview: typeof jsonData === 'object' ? 'objet JSON valide' : typeof jsonData
          });
        } else {
          console.log(`[${requestId}] Réponse API vide reçue en ${duration}ms:`, {
            status: apiResponse.status,
            statusText: apiResponse.statusText
          });
        }
      } catch (e) {
        // Si ce n'est pas du JSON valide, on log juste le statut
        console.log(`[${requestId}] Réponse API non-JSON reçue en ${duration}ms:`, {
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
      
      // Si c'est une erreur 401/403, ajouter des informations utiles pour le debugging
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.warn(`[${requestId}] Erreur d'authentification ${apiResponse.status} détectée`);
        
        if (isJson) {
          // Ajouter des informations de debug pour aider au diagnostic
          jsonData = {
            ...jsonData,
            _debug: {
              requestId,
              endpoint: baseEndpoint,
              tokenProvided: !!acelleToken,
              method: req.method
            }
          };
        }
      }
      
      // Renvoyer la réponse avec les données au format approprié
      if (isJson) {
        return new Response(JSON.stringify(jsonData), {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } else if (responseData) {
        // Pour les réponses non-JSON, renvoyer tel quel
        return new Response(responseData, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } else {
        // Pour les réponses vides
        return new Response(null, {
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
          requestId,
          timeout_ms: CONFIG.DEFAULT_TIMEOUT
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
