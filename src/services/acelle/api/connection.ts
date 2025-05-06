
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl } from "../acelle-service";

/**
 * Vérifie la connexion à l'API Acelle
 */
export const checkAcelleConnectionStatus = async (
  account: AcelleAccount,
  accessToken?: string | null
): Promise<AcelleConnectionDebug> => {
  try {
    if (!account || !account.api_endpoint || !account.api_token) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Informations de connexion insuffisantes"
      };
    }

    // Récupérer le token d'authentification si non fourni
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: "Aucun token d'authentification disponible"
        };
      }
    }
    
    // Utiliser le proxy CORS pour vérifier la connexion à Acelle
    try {
      const startTime = new Date().getTime();
      
      // Construire l'URL pour la vérification en utilisant le proxy CORS existant
      // Utiliser l'endpoint /me qui teste les informations du compte et l'authentification
      const url = buildProxyUrl('me', { api_token: account.api_token });
      
      console.log("Test de connexion via proxy CORS:", url);
      console.log("Headers utilisés:", {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Acelle-Endpoint": account.api_endpoint
      });
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Acelle-Endpoint": account.api_endpoint
        }
      });
      
      const responseTime = new Date().getTime() - startTime;
      
      console.log("Réponse du test:", {
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime
      });
      
      if (!response.ok) {
        console.error("Erreur de connexion:", response.status, response.statusText);
        // Essayer de lire le corps de la réponse pour plus d'informations
        try {
          const errorText = await response.text();
          console.error("Corps de la réponse d'erreur:", errorText);
        } catch (e) {
          console.error("Impossible de lire le corps de la réponse d'erreur");
        }
        
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: `Erreur HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }
      
      // Tenter de parser la réponse
      try {
        const result = await response.json();
        
        console.log("Résultat du test de connexion:", result);
        
        // Si la réponse contient les informations du compte ou n'est pas vide, c'est un succès
        // Toute réponse non-vide est considérée comme valide
        if (result) {
          return {
            success: true,
            timestamp: new Date().toISOString(),
            apiVersion: result.version || "Inconnue",
            responseTime: responseTime,
            responseData: result
          };
        } else {
          return {
            success: false,
            timestamp: new Date().toISOString(),
            errorMessage: "Réponse API vide ou invalide"
          };
        }
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: `Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  } catch (error) {
    console.error("Erreur globale lors de la vérification de connexion:", error);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test la connexion à Acelle avec un compte test
 */
export const testAcelleConnection = async (
  api_endpoint: string,
  api_token: string,
  accessToken?: string | null
): Promise<AcelleConnectionDebug> => {
  // Créer un compte test pour la vérification
  const testAccount: AcelleAccount = {
    id: 'test',
    name: 'Test Connection',
    api_endpoint,
    api_token,
    status: 'inactive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cache_priority: 0,
    last_sync_date: null,
    last_sync_error: null
  };
  
  return await checkAcelleConnectionStatus(testAccount, accessToken);
};
