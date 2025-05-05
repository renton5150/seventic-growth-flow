
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie l'état de la connexion à l'API Acelle
 */
export const checkAcelleConnectionStatus = async (
  account: AcelleAccount,
  accessToken?: string
): Promise<AcelleConnectionDebug> => {
  const startTime = Date.now();
  const debugInfo: AcelleConnectionDebug = {
    success: false,
    timestamp: new Date().toISOString(),
  };

  try {
    if (!account || !account.api_endpoint || !account.api_token) {
      debugInfo.errorMessage = "Informations de compte invalides ou incomplètes";
      return debugInfo;
    }

    if (!accessToken) {
      // Obtenir le token d'accès
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        debugInfo.errorMessage = `Erreur de session: ${sessionError.message}`;
        return debugInfo;
      }
      
      accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        debugInfo.errorMessage = "Pas de token d'accès disponible";
        return debugInfo;
      }
    }

    // Construire l'URL pour une simple vérification d'état
    const endpoint = "me";
    const params = { api_token: account.api_token };
    const url = buildProxyUrl(endpoint, params);

    // Stocker les données de requête pour le débogage
    debugInfo.request = {
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    // Effectuer l'appel API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const statusCode = response.status;
    debugInfo.statusCode = statusCode;

    // Récupérer les données de réponse pour le débogage
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      responseData = { error: "Impossible de parser la réponse JSON" };
    }

    debugInfo.responseData = responseData;
    debugInfo.response = {
      statusCode,
      body: responseData
    };

    // Déterminer le succès en fonction du code de statut
    debugInfo.success = statusCode >= 200 && statusCode < 300;
    
    if (!debugInfo.success) {
      debugInfo.errorMessage = `API error (${statusCode}): ${responseData?.error || response.statusText}`;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugInfo.errorMessage = `Erreur de connexion: ${errorMessage}`;
  } finally {
    // Calculer la durée de la requête
    debugInfo.duration = Date.now() - startTime;
  }

  return debugInfo;
};

// Export alias for compatibility
export const checkConnectionStatus = checkAcelleConnectionStatus;

/**
 * Test the connection to an Acelle account
 * Used by the AcelleAccountForm
 */
export const testAcelleConnection = async (
  endpoint: string,
  apiToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!endpoint || !apiToken) {
      return {
        success: false,
        message: "L'endpoint et le token API sont requis"
      };
    }
    
    // Get the auth token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      return {
        success: false,
        message: "Pas de token d'accès disponible"
      };
    }
    
    // Create a temporary account object for testing
    const testAccount: AcelleAccount = {
      id: 'test',
      name: 'Test Connection',
      api_endpoint: endpoint,
      api_token: apiToken,
      status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cache_priority: 0
    };
    
    // Test the connection
    const result = await checkAcelleConnectionStatus(testAccount, accessToken);
    
    if (result.success) {
      return {
        success: true,
        message: "Connexion établie avec succès"
      };
    } else {
      return {
        success: false,
        message: `Échec de la connexion: ${result.errorMessage || "Erreur inconnue"}`
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors du test: ${errorMessage}`
    };
  }
};
