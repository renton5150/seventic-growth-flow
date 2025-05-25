
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildDirectAcelleApiUrl } from "../acelle-service";

/**
 * Vérifie l'état de la connexion à l'API Acelle directement
 */
export const checkAcelleConnectionStatus = async (account: AcelleAccount) => {
  try {
    console.log(`[checkAcelleConnectionStatus] Début du test pour ${account.name}`);
    
    // Vérifier que les informations du compte sont complètes
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[checkAcelleConnectionStatus] Informations de compte incomplètes", {
        hasAccount: !!account,
        hasToken: account ? !!account.api_token : false,
        hasEndpoint: account ? !!account.api_endpoint : false
      });
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
      per_page: "1"
    };
    
    const testUrl = buildDirectAcelleApiUrl("campaigns", account.api_endpoint, testParams);
    
    console.log(`[checkAcelleConnectionStatus] Test de connexion directe pour ${account.name}: ${testUrl.replace(account.api_token, '***')}`);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct avec headers minimalistes
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    console.log(`[checkAcelleConnectionStatus] Headers utilisés:`, headers);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[checkAcelleConnectionStatus] Réponse reçue: Status ${response.status}, Time ${responseTime}ms`);
    console.log(`[checkAcelleConnectionStatus] Headers de réponse:`, Object.fromEntries(response.headers.entries()));
    
    // Analyser la réponse
    if (!response.ok) {
      let errorMessage = `Erreur API HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.log(`[checkAcelleConnectionStatus] Corps d'erreur:`, errorText);
        if (errorText && errorText.length < 500) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        console.log("[checkAcelleConnectionStatus] Impossible de lire la réponse d'erreur");
      }
      
      // Mettre à jour le statut du compte en erreur
      try {
        await supabase
          .from('acelle_accounts')
          .update({ 
            status: 'error',
            last_sync_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);
        console.log(`[checkAcelleConnectionStatus] Statut du compte ${account.name} mis à jour: error`);
      } catch (updateError) {
        console.error("[checkAcelleConnectionStatus] Erreur lors de la mise à jour du statut du compte:", updateError);
      }
      
      return {
        success: false,
        message: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          headers: Object.fromEntries(response.headers.entries()),
          url: testUrl.replace(account.api_token, '***')
        }
      };
    }
    
    const data = await response.json();
    console.log(`[checkAcelleConnectionStatus] Données reçues pour ${account.name}:`, {
      dataType: typeof data,
      hasData: !!data.data,
      dataLength: data.data ? data.data.length : 0,
      total: data.total
    });
    
    // Mettre à jour le statut du compte en actif
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          status: 'active',
          last_sync_error: null,
          last_sync_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      console.log(`[checkAcelleConnectionStatus] Statut du compte ${account.name} mis à jour: active`);
    } catch (updateError) {
      console.error("[checkAcelleConnectionStatus] Erreur lors de la mise à jour du statut du compte:", updateError);
    }
    
    return {
      success: true,
      message: "Connexion directe établie avec succès",
      details: {
        responseTime,
        apiVersion: data.version || "Inconnue",
        campaignsFound: data.data ? data.data.length : 0,
        totalCampaigns: data.total || 0,
        url: testUrl.replace(account.api_token, '***')
      }
    };
  } catch (error) {
    console.error("[checkAcelleConnectionStatus] Erreur lors de la vérification de la connexion directe:", error);
    
    let errorMessage = "Erreur de connexion";
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = "Erreur de connexion réseau - Vérifiez que l'API Acelle est accessible";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Mettre à jour le statut du compte en erreur
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          status: 'error',
          last_sync_error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      console.log(`[checkAcelleConnectionStatus] Statut du compte ${account.name} mis à jour: error (exception)`);
    } catch (updateError) {
      console.error("[checkAcelleConnectionStatus] Erreur lors de la mise à jour du statut du compte:", updateError);
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
    console.log(`[testAcelleConnection] Test de connexion avec endpoint: ${apiEndpoint}`);
    
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
    
    console.log(`[testAcelleConnection] URL de test: ${testUrl.replace(apiToken, '***')}`);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct avec configuration simplifiée
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    console.log(`[testAcelleConnection] Headers utilisés:`, headers);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`[testAcelleConnection] Test terminé: Status ${response.status}, Durée ${duration}ms`);
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.log(`[testAcelleConnection] Corps d'erreur:`, errorText);
        if (errorText && errorText.length < 500) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        console.log("[testAcelleConnection] Impossible de lire la réponse d'erreur");
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
          headers
        }
      };
    }
    
    const data = await response.json();
    console.log(`[testAcelleConnection] Données reçues:`, {
      dataType: typeof data,
      hasData: !!data.data,
      dataLength: data.data ? data.data.length : 0
    });
    
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
    console.error("[testAcelleConnection] Erreur lors du test de connexion:", error);
    
    let errorMessage = "Erreur de connexion";
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = "Erreur de connexion réseau ou CORS";
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
