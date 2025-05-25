
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildDirectAcelleApiUrl } from "../acelle-service";

/**
 * Vérifie l'état de la connexion à l'API Acelle directement
 */
export const checkAcelleConnectionStatus = async (account: AcelleAccount) => {
  try {
    // Vérifier que les informations du compte sont complètes
    if (!account || !account.api_token || !account.api_endpoint) {
      return {
        success: false,
        message: "Informations de compte incomplètes",
        details: {
          hasAccount: !!account,
          hasToken: account ? !!account.api_token : false,
          hasEndpoint: account ? !!account.api_endpoint : false
        }
      };
    }

    // Construire l'URL pour tester la connexion directement
    const testParams = { 
      api_token: account.api_token,
      page: "1",
      per_page: "1",
      _t: Date.now().toString()  // Anti-cache
    };
    
    const testUrl = buildDirectAcelleApiUrl("campaigns", account.api_endpoint, testParams);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-account-id': account.id,
        'x-acelle-token': account.api_token,
        'Origin': window.location.origin
      },
      signal: AbortSignal.timeout(10000) // Timeout après 10 secondes
    });
    
    const responseTime = Date.now() - startTime;
    
    // Analyser la réponse
    if (!response.ok) {
      return {
        success: false,
        message: `Erreur API directe (${response.status})`,
        details: {
          status: response.status,
          statusText: response.statusText,
          responseTime
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: "Connexion directe établie",
      details: {
        responseTime,
        apiVersion: data.version || "Inconnue",
        data
      }
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de la connexion directe:", error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
      details: {
        error: String(error)
      }
    };
  }
};

/**
 * Teste la connexion à l'API Acelle directement avec les paramètres fournis
 */
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  authToken?: string
): Promise<AcelleConnectionDebug> => {
  try {
    // Construire l'URL pour tester la connexion directement
    const testUrl = buildDirectAcelleApiUrl(
      "campaigns",
      apiEndpoint,
      { 
        api_token: apiToken,
        page: "1",
        per_page: "1" 
      }
    );
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-acelle-token': apiToken,
        'Origin': window.location.origin
      },
      signal: AbortSignal.timeout(10000) // Timeout après 10 secondes
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: `Erreur HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        duration
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      statusCode: response.status,
      apiVersion: data.version || "Inconnue",
      responseData: data
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
};
