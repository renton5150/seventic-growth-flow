
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { ACELLE_PROXY_CONFIG, buildProxyUrl } from "@/services/acelle/acelle-service";
import { supabase } from "@/integrations/supabase/client";

// Enhanced test function for Acelle API connection with improved error handling
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  debug: boolean = false
): Promise<boolean | AcelleConnectionDebug> => {
  try {
    // Fix potential URL issues by ensuring there's no trailing slash
    const cleanApiEndpoint = apiEndpoint?.endsWith('/') 
      ? apiEndpoint.slice(0, -1) 
      : apiEndpoint;
      
    if (!cleanApiEndpoint || !apiToken) {
      throw new Error("API endpoint and token are required");
    }
    
    console.log(`Testing Acelle connection to endpoint: ${cleanApiEndpoint} with auth method: token (as per Acelle Mail docs)`);
    
    // Récupérer le jeton d'authentification Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Erreur lors de la récupération de la session Supabase:", sessionError);
      throw new Error("Erreur d'authentification Supabase: " + sessionError.message);
    }
    
    if (!sessionData?.session?.access_token) {
      console.error("Aucun token d'authentification Supabase disponible");
      throw new Error("Authentification Supabase requise. Veuillez vous reconnecter.");
    }
    
    const supabaseToken = sessionData.session.access_token;
    
    // Construire l'URL correctement pour le test de connexion
    // Utiliser la fonction buildProxyUrl pour éviter les erreurs de construction d'URL
    const proxyUrl = buildProxyUrl('me', { api_token: apiToken });
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Acelle-Endpoint": cleanApiEndpoint,
      "X-Auth-Method": "token", // Ensure we're using token method
      "Authorization": `Bearer ${supabaseToken}` // Ajout crucial de l'en-tête d'autorisation Supabase
    };
    
    const debugInfo: AcelleConnectionDebug = {
      success: false,
      timestamp: new Date().toISOString(),
      request: {
        url: proxyUrl,
        headers,
        method: "GET"
      }
    };
    
    // Tentative d'éveil des Edge Functions avant la requête principale
    try {
      console.log("Tentative d'éveil des Edge Functions...");
      await fetch(`${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(`${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/ping`)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${supabaseToken}`,
          "X-Acelle-Endpoint": cleanApiEndpoint,
          "Content-Type": "application/json",
          "X-Wake-Request": "true"
        },
        cache: "no-store"
      });
      console.log("Requête d'éveil envoyée");
    } catch (wakeError) {
      console.log("Erreur lors de l'éveil des fonctions (ignorée):", wakeError);
    }
    
    // Attendre un court moment pour laisser les fonctions se réveiller
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers,
      // Add cache control headers to prevent browser caching
      cache: "no-store"
    });
    
    if (debug) {
      debugInfo.statusCode = response.status;
      
      try {
        debugInfo.responseData = await response.clone().json();
      } catch (e) {
        try {
          debugInfo.responseData = await response.clone().text();
        } catch (textError) {
          debugInfo.responseData = "Error reading response";
        }
      }
    }
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      
      // Log detailed response for debugging
      try {
        const errorText = await response.text();
        console.error("API Error details:", errorText);
      } catch (e) {
        console.error("Could not read error response");
      }
      
      if (debug) {
        debugInfo.errorMessage = `API Error: ${response.status} ${response.statusText}`;
        return debugInfo;
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API test response:", data);
    const success = !!data.id;
    
    if (debug) {
      debugInfo.success = success;
      return debugInfo;
    }
    
    return success;
  } catch (error) {
    console.error("Error testing Acelle API connection:", error);
    
    if (debug) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        request: {
          url: buildProxyUrl('me', { api_token: apiToken }),
          headers: { 
            "Accept": "application/json",
            "X-Acelle-Endpoint": apiEndpoint,
            "X-Auth-Method": "token"
          },
          method: "GET"
        }
      };
    }
    
    return false;
  }
};
