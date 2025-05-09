
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint, x-auth-method',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Fonction simple pour tester l'authentification Acelle sans aucune logique supplémentaire
serve(async (req) => {
  // Pour les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Test d'authentification Acelle démarré");
    
    // Récupérer les headers d'authentification
    const token = req.headers.get('x-acelle-token');
    const endpoint = req.headers.get('x-acelle-endpoint');
    
    if (!token || !endpoint) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Les headers x-acelle-token et x-acelle-endpoint sont requis"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Nettoyer l'URL (enlever le slash final si présent)
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    
    // Construire l'URL de test (endpoint /me)
    const testUrl = `${cleanEndpoint}/api/v1/me?api_token=${token}`;
    console.log(`URL de test: ${cleanEndpoint}/api/v1/me`);
    
    // Définir les headers pour la requête
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Acelle-API-Client/1.0',
    };
    
    console.log("Envoi de la requête de test...");
    
    // Effectuer la requête avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(testUrl, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Réponse reçue: ${response.status} ${response.statusText}`);
    
    // Récupérer les headers de la réponse
    const responseHeaders = new Headers({
      ...corsHeaders,
      'Content-Type': 'application/json'
    });
    
    // Si la réponse n'est pas OK
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e) {
        errorBody = "Impossible de lire le corps de la réponse";
      }
      
      console.error(`Erreur d'authentification: ${response.status} ${response.statusText}`);
      console.error(`Corps de la réponse: ${errorBody}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erreur d'authentification: ${response.status} ${response.statusText}`,
          status: response.status,
          body: errorBody,
          tested_url: `${cleanEndpoint}/api/v1/me` // Sans exposer le token
        }),
        { headers: responseHeaders, status: 200 } // Retourner 200 pour permettre l'affichage du diagnostic
      );
    }
    
    // Analyser la réponse
    let data;
    try {
      data = await response.json();
      console.log("Réponse JSON valide reçue");
    } catch (e) {
      const text = await response.text();
      data = { rawText: text };
      console.log("Réponse non-JSON reçue");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Authentification réussie",
        status: response.status,
        data,
        apiVersion: data?.meta?.version || "Unknown",
        tested_url: `${cleanEndpoint}/api/v1/me` // Sans exposer le token
      }),
      { headers: responseHeaders, status: 200 }
    );
    
  } catch (error) {
    console.error(`Erreur de test d'authentification: ${error instanceof Error ? error.message : String(error)}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors du test: ${error instanceof Error ? error.message : String(error)}`,
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
