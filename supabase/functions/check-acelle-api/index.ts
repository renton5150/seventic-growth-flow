
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Configuration CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-acelle-token, x-acelle-endpoint, x-auth-method',
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
  authMethod?: string; // Méthode d'authentification utilisée
}

// Fonction pour tester une API avec une méthode d'authentification spécifique
async function testApiWithAuthMethod(
  url: string, 
  apiToken: string,
  authMethod: string,
  timeout: number = 10000
): Promise<DiagnosticResponse> {
  const startTime = Date.now();
  
  try {
    console.log(`Testing API with auth method ${authMethod}: ${url}`);
    
    // Construire l'URL et les headers selon la méthode d'authentification
    let finalUrl = url;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Seventic-Acelle-Check/3.0'
    };
    
    // Configurer l'authentification selon la méthode
    switch (authMethod) {
      case 'url_param':
        // Ajouter le token API comme paramètre d'URL
        finalUrl = url.includes('?') 
          ? `${url}&api_token=${apiToken}`
          : `${url}?api_token=${apiToken}`;
        break;
        
      case 'bearer':
        // Utiliser le header Authorization: Bearer
        headers['Authorization'] = `Bearer ${apiToken}`;
        break;
        
      case 'both':
        // Utiliser à la fois le paramètre URL et le header Bearer
        finalUrl = url.includes('?') 
          ? `${url}&api_token=${apiToken}`
          : `${url}?api_token=${apiToken}`;
        headers['Authorization'] = `Bearer ${apiToken}`;
        break;
        
      default:
        // Par défaut utiliser le paramètre URL (méthode validée par cURL)
        finalUrl = url.includes('?') 
          ? `${url}&api_token=${apiToken}`
          : `${url}?api_token=${apiToken}`;
        break;
    }
    
    // Ajouter un timestamp anti-cache
    const timestamp = Date.now();
    finalUrl = finalUrl.includes('?')
      ? `${finalUrl}&_t=${timestamp}`
      : `${finalUrl}?_t=${timestamp}`;
    
    // Controller pour implémenter un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Effectuer la requête
    const response = await fetch(finalUrl, {
      headers,
      signal: controller.signal
    });
    
    // Annuler le timeout
    clearTimeout(timeoutId);
    
    // Calculer la durée
    const duration = Date.now() - startTime;
    
    // Si la réponse n'est pas OK
    if (!response.ok) {
      console.error(`API test with method ${authMethod} failed: ${response.status} ${response.statusText}`);
      
      // Récupérer les détails de l'erreur si possible
      let responseData;
      try {
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (e) {
        responseData = "Could not parse response";
      }
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: `HTTP Error ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        duration,
        responseData,
        authMethod
      };
    }
    
    // Analyser la réponse
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Si ce n'est pas du JSON valide, renvoyer le texte brut
      const text = await response.text();
      data = { rawText: text };
    }
    
    console.log(`API test with method ${authMethod} successful in ${duration}ms`);
    
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
      responseData: data,
      authMethod
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`API test with method ${authMethod} exception: ${errorMessage}`);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: errorMessage,
      duration,
      authMethod
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
    const testMultipleAuth = url.searchParams.get('testMultipleAuth') === 'true';
    
    // Récupérer les headers d'authentification alternatifs
    const headerToken = req.headers.get('x-acelle-token');
    const headerEndpoint = req.headers.get('x-acelle-endpoint');
    const authMethod = req.headers.get('x-auth-method') || 'url_param'; // Par défaut, utiliser la méthode URL validée
    
    // Récupérer le corps de la requête pour les méthodes POST
    let requestBody = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch (e) {
        // Si le corps n'est pas du JSON valide, l'ignorer silencieusement
      }
    }
    
    // Utiliser les headers si les paramètres URL sont manquants
    const finalApiUrl = apiUrl || headerEndpoint || requestBody?.apiEndpoint;
    const finalApiToken = apiToken || headerToken || requestBody?.apiToken;
    
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
    
    // Vérifier si nous devons tester plusieurs méthodes d'authentification
    if (testMultipleAuth || authMethod === 'multiple' || requestBody?.testMultipleAuthMethods) {
      console.log("Testing multiple authentication methods");
      
      // Tester uniquement avec les méthodes prioritaires basées sur les tests cURL
      const authMethods = ['url_param', 'bearer', 'both'];
      
      const testPromises = authMethods.map(method => 
        testApiWithAuthMethod(testEndpoint, finalApiToken, method)
      );
      
      const results = await Promise.all(testPromises);
      
      // Trouver la première méthode qui a réussi
      const successfulMethod = results.find(r => r.success);
      
      // Retourner soit la méthode qui a réussi, soit tous les résultats
      return new Response(
        JSON.stringify(successfulMethod || { 
          success: false, 
          timestamp: new Date().toISOString(),
          errorMessage: "Aucune méthode d'authentification n'a fonctionné",
          results: results 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Tester la connexion à l'API avec la méthode spécifiée
    const result = await testApiWithAuthMethod(testEndpoint, finalApiToken, authMethod);
    
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
