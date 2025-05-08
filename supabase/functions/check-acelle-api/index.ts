
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Interface pour une réponse de diagnostic
interface DiagnosticResponse {
  success: boolean;
  timestamp: string;
  errorMessage?: string;
  statusCode?: number;
  duration?: number;
  apiVersion?: string;
  responseData?: any;
}

// Fonction pour tester une API
async function testApi(
  url: string, 
  apiToken: string, 
  timeout: number = 10000
): Promise<DiagnosticResponse> {
  const startTime = Date.now();
  
  try {
    console.log(`Testing API connectivity: ${url}`);
    
    // Construire l'URL avec le token API
    const finalUrl = `${url}?api_token=${apiToken}`;
    
    // Controller pour implémenter un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Effectuer la requête
    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}` // Également envoyer le token par header
      },
      signal: controller.signal
    });
    
    // Annuler le timeout
    clearTimeout(timeoutId);
    
    // Calculer la durée
    const duration = Date.now() - startTime;
    
    // Si la réponse n'est pas OK
    if (!response.ok) {
      console.error(`API test failed: ${response.status} ${response.statusText}`);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: `HTTP Error ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        duration
      };
    }
    
    // Analyser la réponse
    const data = await response.json();
    console.log(`API test successful in ${duration}ms`);
    
    // Extraire la version de l'API si disponible
    let apiVersion = "Unknown";
    if (data && data.meta && data.meta.version) {
      apiVersion = data.meta.version;
    }
    
    // Retourner le résultat
    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      duration,
      apiVersion,
      responseData: data
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`API test exception: ${errorMessage}`);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: errorMessage,
      duration
    };
  }
}

serve(async (req) => {
  // Pour les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Récupérer les paramètres de la requête
    const url = new URL(req.url);
    const apiUrl = url.searchParams.get('url');
    const apiToken = url.searchParams.get('token');
    const detailed = url.searchParams.get('detailed') === 'true';
    
    // Récupérer les headers d'authentification alternatifs
    const headerToken = req.headers.get('x-acelle-token');
    const headerEndpoint = req.headers.get('x-acelle-endpoint');
    
    // Utiliser les headers si les paramètres URL sont manquants
    const finalApiUrl = apiUrl || headerEndpoint;
    const finalApiToken = apiToken || headerToken;
    
    console.log(`Vérification API: ${finalApiUrl}`);
    
    // Vérifier que les paramètres sont présents
    if (!finalApiUrl || !finalApiToken) {
      console.error("Missing required parameters: url and token");
      return new Response(
        JSON.stringify({ 
          success: false, 
          timestamp: new Date().toISOString(),
          errorMessage: "Les paramètres URL et token sont requis" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Nettoyer l'URL (enlever le slash final si présent)
    const cleanApiUrl = finalApiUrl.replace(/\/$/, '');
    
    // Définir l'endpoint à tester
    const testEndpoint = detailed ? 
      `${cleanApiUrl}/me` : // Endpoint détaillé
      `${cleanApiUrl}/ping`; // Endpoint simple
    
    // Tester la connexion à l'API
    const result = await testApi(testEndpoint, finalApiToken);
    
    // Retourner le résultat
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error(`Error in check-acelle-api: ${error instanceof Error ? error.message : String(error)}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        timestamp: new Date().toISOString(),
        errorMessage: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
