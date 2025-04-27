
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Test Acelle API connection
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
      const errorMessage = "L'URL de l'API et le token API sont requis";
      console.error(errorMessage);
      
      if (!debug) {
        toast.error(errorMessage);
      }
      
      if (debug) {
        return {
          success: false,
          errorMessage,
          request: {
            url: `${ACELLE_PROXY_BASE_URL}/me`,
            headers: {}
          }
        };
      }
      
      return false;
    }

    console.log(`Test de connexion avec endpoint: ${cleanApiEndpoint}, token: ${apiToken.substring(0, 10)}...`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      const errorMessage = "Authentification Supabase requise";
      console.error(errorMessage);
      
      if (!debug) {
        toast.error(errorMessage);
      }
      
      if (debug) {
        return {
          success: false,
          errorMessage,
          request: {
            url: `${ACELLE_PROXY_BASE_URL}/me`,
            headers: {}
          }
        };
      }
      
      return false;
    }
      
    console.log(`Tentative de connexion à Acelle avec URL: ${cleanApiEndpoint}`);
    console.log(`Token API (premiers caractères): ${apiToken.substring(0, 10)}...`);
      
    const url = `${ACELLE_PROXY_BASE_URL}/test-acelle-connection`;
    
    // Préparation des en-têtes pour l'edge function
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Acelle-Endpoint": cleanApiEndpoint,
      "X-Acelle-Token": apiToken,
      "Authorization": `Bearer ${accessToken}`  // Utilisation du token JWT Supabase
    };
    
    const debugInfo: AcelleConnectionDebug = {
      success: false,
      request: {
        url: url,
        headers
      }
    };
    
    // Attempt to wake up the Edge Function if it's cold
    if (debug) {
      try {
        await fetch(`${ACELLE_PROXY_BASE_URL}/ping`, {
          method: "OPTIONS",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          signal: AbortSignal.timeout(3000)
        });
        console.log("Envoi du ping de réveil à la Edge Function");
      } catch (e) {
        console.log("Le ping de réveil a échoué ou expiré (normal pour les démarrages à froid)");
      }
    }
    
    // Add a short delay to allow edge function to wake up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Envoi de la requête à: ${url}`);
    console.log(`En-têtes de la requête:`, headers);
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`Réponse reçue avec statut: ${response.status}`);
    
    if (debug) {
      debugInfo.statusCode = response.status;
      
      try {
        // Fix: We need to ensure responseData is properly structured as an object
        const responseJson = await response.clone().json();
        debugInfo.responseData = responseJson;
      } catch (e) {
        try {
          const textResponse = await response.clone().text();
          // Fix: Instead of assigning the string directly, create an object with error message
          debugInfo.responseData = {
            error: textResponse,
            message: "Response couldn't be parsed as JSON"
          };
        } catch (textError) {
          // Fix: Create an object instead of assigning a string
          debugInfo.responseData = {
            error: "Error reading response",
            message: "Failed to read response body"
          };
        }
      }
    }
    
    if (!response.ok) {
      const errorMessage = `Erreur API: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      
      try {
        const errorText = await response.clone().text();
        console.error("Contenu de la réponse d'erreur:", errorText);
      } catch (e) {
        console.error("Impossible de lire le contenu de l'erreur");
      }
      
      if (debug) {
        debugInfo.errorMessage = errorMessage;
        return debugInfo;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Données reçues:", JSON.stringify(data).substring(0, 200));
    
    const success = data.success === true;
    
    if (debug) {
      debugInfo.success = success;
      if (!success) {
        debugInfo.errorMessage = data.message || "La réponse n'indique pas un succès";
      }
      return debugInfo;
    }
    
    return success;
  } catch (error) {
    console.error("Error testing Acelle API connection:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    if (!debug) {
      toast.error(`Erreur de connexion: ${errorMessage}`);
    }
    
    if (debug) {
      return {
        success: false,
        errorMessage,
        request: {
          url: `${ACELLE_PROXY_BASE_URL}/test-acelle-connection`,
          headers: { 
            "Accept": "application/json",
            "X-Acelle-Endpoint": apiEndpoint,
            "Authorization": "Bearer [SUPABASE_TOKEN]",
            "X-Acelle-Token": apiToken
          }
        }
      };
    }
    
    return false;
  }
};
