
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS simplifiée pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint, path',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Pour les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Nouvelle requête reçue sur acelle-proxy-simple");
    
    // Récupérer le token et l'endpoint Acelle des headers
    const token = req.headers.get('x-acelle-token');
    const endpoint = req.headers.get('x-acelle-endpoint');
    
    if (!token || !endpoint) {
      console.error("Token ou endpoint manquants dans les headers");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Les headers x-acelle-token et x-acelle-endpoint sont requis" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Récupérer le chemin API depuis les paramètres d'URL
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';
    
    // Nettoyer l'endpoint (enlever slash final si présent)
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    
    // Construction de l'URL de base de l'API
    let apiUrl = `${cleanEndpoint}/${path}`;
    
    // Toujours ajouter le token API comme paramètre URL (méthode qui fonctionne partout)
    apiUrl += (apiUrl.includes('?') ? '&' : '?') + `api_token=${token}`;
    
    // Ajouter d'autres paramètres d'URL (sauf path et api_token qui sont déjà traités)
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'path' && key !== 'api_token') {
        apiUrl += `&${key}=${value}`;
      }
    }
    
    // Ajouter un paramètre anti-cache
    apiUrl += `&_t=${Date.now()}`;
    
    console.log(`Requête vers: ${apiUrl.replace(token, 'API_TOKEN_MASQUÉ')}`);
    
    // Préparer les headers pour la requête à l'API
    const apiHeaders = new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Acelle-API-Client/1.0'
    });
    
    // Définir les options de la requête
    const options: RequestInit = {
      method: req.method,
      headers: apiHeaders,
    };
    
    // Si la requête a un body, le copier
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = await req.text();
    }
    
    // Faire la requête à l'API avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes
    options.signal = controller.signal;
    
    try {
      console.log(`Envoi de requête ${req.method} à l'API Acelle`);
      const response = await fetch(apiUrl, options);
      clearTimeout(timeoutId);
      
      // Préparer les headers de réponse
      const responseHeaders = new Headers(corsHeaders);
      responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/json');
      
      // Récupérer le corps de la réponse
      const responseBody = await response.text();
      
      console.log(`Réponse reçue: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`Erreur API: ${response.status} ${response.statusText}`);
        console.error(`Corps de réponse: ${responseBody}`);
      }
      
      // Renvoyer la réponse au client
      return new Response(responseBody, {
        status: response.status,
        headers: responseHeaders
      });
      
    } catch (fetchError) {
      // Gérer les erreurs de fetch
      clearTimeout(timeoutId);
      
      const isTimeout = fetchError.name === 'AbortError';
      const errorMessage = isTimeout 
        ? "Timeout: La requête a pris trop de temps" 
        : `Erreur de connexion: ${fetchError.message}`;
      
      console.error(errorMessage);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          isTimeout,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: isTimeout ? 504 : 502 
        }
      );
    }
    
  } catch (error) {
    console.error(`Erreur générale: ${error instanceof Error ? error.message : String(error)}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
