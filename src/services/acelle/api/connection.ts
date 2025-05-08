import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildProxyUrl } from "@/utils/acelle/proxyUtils";

/**
 * Vérifie l'état de la connexion à l'API Acelle
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

    // Récupérer le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      return {
        success: false,
        message: "Non authentifié",
        details: {
          reason: "Aucun token d'authentification disponible"
        }
      };
    }

    // Construire l'URL pour tester la connexion
    // Utilisation de /campaigns au lieu de /ping qui n'est pas un endpoint valide dans l'API Acelle
    const testEndpoint = "campaigns";
    const testParams = { 
      api_token: account.api_token,
      _t: Date.now().toString()  // Anti-cache
    };
    
    const testUrl = buildProxyUrl(testEndpoint, testParams);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Préparer les en-têtes avec la double authentification (en-têtes + URL)
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Acelle-Token': account.api_token,
      'X-Acelle-Endpoint': account.api_endpoint
    };
    
    console.debug("Vérification connexion API Acelle:", { 
      url: testUrl.replace(account.api_token, "***MASKED***"),
      headers: {
        ...headers,
        'X-Acelle-Token': '***MASKED***',
        'Authorization': '***PRÉSENT***'
      }
    });
    
    // Effectuer l'appel API avec un timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 secondes de timeout
    
    try {
      // Effectuer l'appel API
      const response = await fetch(testUrl, {
        headers,
        signal: abortController.signal
      });
      
      // Annuler le timeout
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      // Analyser la réponse
      if (!response.ok) {
        console.error("Erreur API Acelle:", {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          headers: Object.fromEntries(
            Array.from(response.headers.entries())
              .filter(([key]) => !key.toLowerCase().includes("auth"))
          )
        });
        
        // Tentative de récupération du corps de la réponse pour diagnostic
        let responseBody = null;
        try {
          responseBody = await response.text();
        } catch (e) {
          console.warn("Impossible de lire le corps de la réponse d'erreur");
        }
        
        return {
          success: false,
          message: `Erreur API (${response.status})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            responseTime,
            responseBody
          }
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        message: "Connexion établie",
        details: {
          responseTime,
          apiVersion: data.version || "Inconnue",
          data
        }
      };
    } catch (fetchError) {
      // Annuler le timeout si l'erreur n'est pas due au timeout
      if (fetchError.name !== 'AbortError') {
        clearTimeout(timeoutId);
      }
      
      const isTimeout = fetchError.name === 'AbortError';
      const errorMsg = isTimeout 
        ? "Timeout de connexion à l'API" 
        : `Erreur de connexion: ${fetchError.message}`;
      
      console.error(errorMsg, { error: fetchError, isTimeout });
      
      return {
        success: false,
        message: errorMsg,
        details: {
          error: String(fetchError),
          isTimeout,
          endpoint: account.api_endpoint
        }
      };
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la connexion:", error);
    
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
 * Teste la connexion à l'API Acelle avec les paramètres fournis
 */
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  authToken: string
): Promise<AcelleConnectionDebug> => {
  try {
    // Construire l'URL pour tester la connexion en utilisant le proxy
    const testEndpoint = "campaigns";
    const testParams = {
      api_token: apiToken,
      _t: Date.now().toString() // Anti-cache
    };
    
    const testUrl = buildProxyUrl(testEndpoint, testParams);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Préparer les en-têtes avec la double authentification (en-têtes + URL)
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Acelle-Token': apiToken,
      'X-Acelle-Endpoint': apiEndpoint
    };
    
    console.debug("Test connexion API Acelle:", { 
      url: testUrl.replace(apiToken, "***MASKED***"), 
      headers: {
        ...headers,
        'X-Acelle-Token': '***MASKED***',
        'Authorization': '***PRÉSENT***'
      }
    });
    
    // Effectuer l'appel API avec un timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(testUrl, {
        headers,
        signal: abortController.signal
      });
      
      // Annuler le timeout
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        let responseText = "";
        
        try {
          responseText = await response.text();
          console.error("Réponse d'erreur API:", responseText);
        } catch (e) {
          console.error("Impossible de lire la réponse d'erreur");
        }
        
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage,
          statusCode: response.status,
          duration,
          responseData: responseText ? { text: responseText } : undefined,
          authMethod: "Double (URL + Headers)"
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration,
        statusCode: response.status,
        apiVersion: data.version || "Inconnue",
        responseData: data,
        authMethod: "Double (URL + Headers)"
      };
    } catch (fetchError) {
      // Annuler le timeout si l'erreur n'est pas due au timeout
      if (fetchError.name !== 'AbortError') {
        clearTimeout(timeoutId);
      }
      
      const isTimeout = fetchError.name === 'AbortError';
      const errorMsg = isTimeout 
        ? "La connexion a expiré (timeout)" 
        : `Erreur de connexion: ${fetchError.message}`;
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: errorMsg,
        isTimeout, // This is now properly typed
        authMethod: "Double (URL + Headers)"
      };
    }
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error),
      authMethod: "Double (URL + Headers)"
    };
  }
};
