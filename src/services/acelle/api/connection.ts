
import { supabase } from "@/integrations/supabase/client";
import { AcelleConnectionDebug } from "@/types/acelle.types";

/**
 * Vérifie la disponibilité de l'API Acelle
 */
export const checkApiAvailability = async (accountId?: string): Promise<{
  available: boolean;
  endpoints?: Record<string, boolean>;
  debugInfo?: AcelleConnectionDebug;
}> => {
  try {
    // Utilise l'Edge Function pour vérifier la disponibilité
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'check-availability',
        accountId: accountId || ''
      }
    });

    if (error) {
      console.error("Erreur lors de la vérification de l'API Acelle:", error);
      return {
        available: false,
        endpoints: {
          campaigns: false,
          details: false
        },
        debugInfo: {
          success: false,
          errorMessage: error.message,
          statusCode: 500
        }
      };
    }

    return data || {
      available: false,
      endpoints: {
        campaigns: false,
        details: false
      }
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'API Acelle:", error);
    return {
      available: false,
      endpoints: {
        campaigns: false,
        details: false
      },
      debugInfo: {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        statusCode: 500
      }
    };
  }
};

/**
 * Teste la connexion à un compte Acelle
 */
export const testConnection = async (
  apiEndpoint: string,
  apiToken: string
): Promise<{ success: boolean; message: string; debugInfo?: AcelleConnectionDebug }> => {
  try {
    console.log("Test de connexion Acelle via Edge Function");
    
    // S'assurer que l'endpoint ne se termine pas par un slash
    const cleanEndpoint = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    
    // Utilise l'Edge Function pour contourner les problèmes CORS
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'test-connection',
        apiEndpoint: cleanEndpoint,
        apiToken,
        debug: true,
        authMethods: ['token', 'basic', 'header']
      }
    });

    if (error) {
      console.error("Erreur lors du test de connexion Acelle:", error);
      return { 
        success: false, 
        message: `Erreur Edge Function: ${error.message}`,
        debugInfo: {
          success: false,
          errorMessage: `Erreur Edge Function: ${error.message}`,
          statusCode: 500,
          request: {
            url: cleanEndpoint,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        }
      };
    }

    console.log("Réponse du test de connexion:", data);
    
    // Si la réponse contient des informations de débogage, les retourner
    if (data && typeof data === 'object' && 'debugInfo' in data) {
      return {
        success: data.success || false,
        message: data.message || (data.success ? "Connexion réussie" : "Échec de la connexion"),
        debugInfo: data.debugInfo
      };
    }

    return data || { 
      success: false, 
      message: "Réponse invalide du serveur"
    };
  } catch (error) {
    console.error("Erreur lors du test de connexion Acelle:", error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      debugInfo: {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        statusCode: 500,
        request: {
          url: apiEndpoint,
          method: 'GET'
        }
      }
    };
  }
};
