
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
      
      if (!response.ok) {
        console.error("Erreur de connexion:", response.status, response.statusText);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: `Erreur HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      // Tenter de parser la réponse
      try {
        const result = await response.json();
        
        console.log("Résultat du test de connexion:", result);
        
        // Si la réponse contient les informations du compte, c'est un succès
        if (result && result.user) {
          return {
            success: true,
            timestamp: new Date().toISOString(),
            apiVersion: result.version || "Inconnue",
            responseTime: responseTime
          };
        } else {
          return {
            success: false,
            timestamp: new Date().toISOString(),
            errorMessage: "Réponse API invalide"
          };
        }
      } catch (parseError) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: `Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  } catch (error) {
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
