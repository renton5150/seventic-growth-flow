
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
    
    // Effectuer l'appel API direct avec headers CORS appropriés
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-account-id': account.id,
        'x-acelle-token': account.api_token,
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, x-account-id, x-acelle-token'
      },
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(15000) // Timeout après 15 secondes
    });
    
    const responseTime = Date.now() - startTime;
    
    // Analyser la réponse
    if (!response.ok) {
      let errorMessage = `Erreur API HTTP ${response.status}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      } catch (e) {
        // Impossible de lire la réponse d'erreur
      }
      
      return {
        success: false,
        message: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: "Connexion directe établie avec succès",
      details: {
        responseTime,
        apiVersion: data.version || "Inconnue",
        campaignsFound: data.data ? data.data.length : 0,
        totalCampaigns: data.total || 0
      }
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de la connexion directe:", error);
    
    let errorMessage = "Erreur de connexion";
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = "Erreur CORS - Impossible d'accéder à l'API Acelle. Vérifiez la configuration CORS du serveur.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      details: {
        error: String(error),
        timestamp: new Date().toISOString()
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
    
    // Effectuer l'appel API direct avec gestion CORS améliorée
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-acelle-token': apiToken,
        'Origin': window.location.origin
      },
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(15000) // Timeout après 15 secondes
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        if (errorText && errorText.length < 500) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        // Impossible de lire la réponse d'erreur
      }
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage,
        statusCode: response.status,
        duration,
        request: {
          url: testUrl.replace(apiToken, '***'),
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      statusCode: response.status,
      apiVersion: data.version || "Inconnue",
      responseData: {
        campaignsCount: data.data ? data.data.length : 0,
        totalCampaigns: data.total || 0,
        hasData: !!data.data
      },
      request: {
        url: testUrl.replace(apiToken, '***'),
        method: 'GET'
      }
    };
  } catch (error) {
    let errorMessage = "Erreur de connexion";
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = "Erreur CORS - L'API Acelle n'autorise pas les requêtes depuis ce domaine";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage,
      request: {
        url: apiEndpoint,
        method: 'GET'
      }
    };
  }
};
