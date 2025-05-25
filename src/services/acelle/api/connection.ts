
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
      per_page: "1"
    };
    
    const testUrl = buildDirectAcelleApiUrl("campaigns", account.api_endpoint, testParams);
    
    console.log(`Test de connexion directe pour ${account.name}: ${testUrl.replace(account.api_token, '***')}`);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct avec headers simplifiés selon la config Icodia
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        // Suppression de tous les headers CORS personnalisés qui causent des problèmes
        // Le serveur Icodia gère déjà CORS côté serveur
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`Réponse reçue: Status ${response.status}, Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Analyser la réponse
    if (!response.ok) {
      let errorMessage = `Erreur API HTTP ${response.status}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += `: ${errorText}`;
        }
      } catch (e) {
        console.log("Impossible de lire la réponse d'erreur");
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
      } catch (updateError) {
        console.error("Erreur lors de la mise à jour du statut du compte:", updateError);
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
    console.log(`Données reçues pour ${account.name}:`, data);
    
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
    } catch (updateError) {
      console.error("Erreur lors de la mise à jour du statut du compte:", updateError);
    }
    
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
    } catch (updateError) {
      console.error("Erreur lors de la mise à jour du statut du compte:", updateError);
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
    
    console.log(`Test de connexion: ${testUrl.replace(apiToken, '***')}`);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Effectuer l'appel API direct avec configuration simplifiée
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        // Headers simplifiés - le serveur Icodia gère CORS
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`Test terminé: Status ${response.status}, Durée ${duration}ms`);
    
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        if (errorText && errorText.length < 500) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        console.log("Impossible de lire la réponse d'erreur");
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
    console.error("Erreur lors du test de connexion:", error);
    
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
