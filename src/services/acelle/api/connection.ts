
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";
import { wakeupCorsProxy } from "../cors-proxy"; // Correction du chemin d'importation

/**
 * Teste la connexion à l'API Acelle
 */
export const testAcelleConnection = async (account: AcelleAccount): Promise<AcelleConnectionDebug> => {
  console.log(`Test de connexion à l'API Acelle pour ${account.name}...`);
  
  try {
    if (!account.api_endpoint || !account.api_token) {
      return {
        success: false,
        errorMessage: "URL de l'API ou token manquant",
        timestamp: new Date().toISOString(),
        accountName: account.name
      };
    }
    
    // Obtenir un token d'authentification à jour
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Erreur lors de la récupération de la session:", sessionError);
      throw new Error(`Erreur de session: ${sessionError.message}`);
    }
    
    const authToken = sessionData?.session?.access_token;
    if (!authToken) {
      console.error("Aucun token d'authentification disponible");
      throw new Error("Vous devez être connecté pour tester la connexion à l'API");
    }
    
    // Réveiller le proxy si nécessaire
    await wakeupCorsProxy(authToken);
    
    // Construire l'URL pour tester la connexion (endpoint /me)
    const apiPath = "me";
    const url = buildProxyUrl(apiPath);
    
    console.log(`Test d'API avec URL: ${url}`, {
      endpoint: account.api_endpoint,
      hasToken: !!account.api_token
    });
    
    const startTime = Date.now();
    
    // Effectuer la requête
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Acelle-Token": account.api_token,
        "X-Acelle-Endpoint": account.api_endpoint,
        "Authorization": `Bearer ${authToken}`,
        "X-Request-ID": `test_${Date.now()}`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      cache: "no-store"
    });
    
    const duration = Date.now() - startTime;
    
    // Si le statut n'est pas OK
    if (!response.ok) {
      const errorText = await response.text();
      
      console.error(`Erreur API: ${response.status} - ${response.statusText}`, {
        url,
        errorText
      });
      
      return {
        success: false,
        errorMessage: `Erreur API ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        accountName: account.name,
        statusCode: response.status,
        duration,
        request: {
          url,
          method: "GET"
        },
        responseData: {
          error: true,
          message: errorText
        }
      };
    }
    
    // Analyser la réponse JSON
    const data = await response.json();
    
    if (!data) {
      return {
        success: false,
        errorMessage: "Réponse JSON invalide",
        timestamp: new Date().toISOString(),
        accountName: account.name,
        statusCode: response.status,
        duration,
        request: {
          url,
          method: "GET"
        },
        responseData: null
      };
    }
    
    // Vérifier si la réponse indique une erreur
    if (data.error || (data.status && data.status !== "success")) {
      const errorMessage = data.error || data.message || "Erreur inconnue";
      
      return {
        success: false,
        errorMessage,
        timestamp: new Date().toISOString(),
        accountName: account.name,
        statusCode: response.status,
        duration,
        request: {
          url,
          method: "GET"
        },
        responseData: data
      };
    }
    
    // Si tout va bien
    return {
      success: true,
      accountName: data.display_name || data.email || account.name,
      version: data.version || "Inconnue",
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      duration,
      request: {
          url,
          method: "GET",
          headers: {
            "X-Acelle-Token": "***", // Masquer le token pour la sécurité
            "X-Acelle-Endpoint": account.api_endpoint,
            "Accept": "application/json"
          }
      },
      responseData: data
    };
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    
    // Formater le message d'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      errorMessage,
      timestamp: new Date().toISOString(),
      accountName: account.name
    };
  }
};
