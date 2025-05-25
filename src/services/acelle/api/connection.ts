
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildCleanAcelleApiUrl, callViaEdgeFunction, callDirectAcelleApi } from "../acelle-service";

/**
 * Vérifie l'état de la connexion en priorisant les edge functions
 */
export const checkAcelleConnectionStatus = async (account: AcelleAccount) => {
  try {
    console.log(`[checkAcelleConnectionStatus] Test connexion pour ${account.name}`);
    
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[checkAcelleConnectionStatus] Informations compte incomplètes");
      
      await updateAccountStatus(account.id, 'error', 'Informations de compte incomplètes');
      
      return {
        success: false,
        message: "Informations de compte incomplètes",
        details: { incomplete: true }
      };
    }

    // Étape 1: Essayer via edge function (méthode recommandée)
    try {
      console.log(`[checkAcelleConnectionStatus] Tentative via edge function`);
      
      // Utiliser une campagne existante pour tester la connexion
      const { data: existingCampaigns } = await supabase
        .from('email_campaigns_cache')
        .select('campaign_uid')
        .eq('account_id', account.id)
        .limit(1);
      
      if (existingCampaigns && existingCampaigns.length > 0) {
        const testCampaignId = existingCampaigns[0].campaign_uid;
        const result = await callViaEdgeFunction(testCampaignId, account.id, false);
        
        if (result && result.success) {
          console.log(`[checkAcelleConnectionStatus] Edge function OK pour ${account.name}`);
          
          await updateAccountStatus(account.id, 'active', null);
          
          return {
            success: true,
            message: "Connexion établie via edge function",
            details: { method: 'edge_function', campaignTested: testCampaignId }
          };
        }
      }
    } catch (edgeError) {
      console.warn(`[checkAcelleConnectionStatus] Edge function échouée:`, edgeError);
    }

    // Étape 2: Fallback vers appel direct simplifié
    try {
      console.log(`[checkAcelleConnectionStatus] Fallback vers appel direct`);
      
      const testUrl = buildCleanAcelleApiUrl(
        "campaigns",
        account.api_endpoint,
        { 
          api_token: account.api_token,
          page: "1",
          per_page: "1"
        }
      );
      
      const startTime = Date.now();
      const data = await callDirectAcelleApi(testUrl, { timeout: 8000 });
      const duration = Date.now() - startTime;
      
      if (data && (data.data || data.campaigns)) {
        console.log(`[checkAcelleConnectionStatus] Appel direct OK pour ${account.name}`);
        
        await updateAccountStatus(account.id, 'active', null);
        
        return {
          success: true,
          message: "Connexion établie via appel direct",
          details: { 
            method: 'direct_api',
            duration,
            campaignsFound: data.data ? data.data.length : 0
          }
        };
      }
    } catch (directError) {
      console.error(`[checkAcelleConnectionStatus] Appel direct échoué:`, directError);
      
      const errorMessage = directError instanceof Error ? directError.message : String(directError);
      await updateAccountStatus(account.id, 'error', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        details: { method: 'direct_api', error: errorMessage }
      };
    }

    // Si on arrive ici, aucune méthode n'a fonctionné
    await updateAccountStatus(account.id, 'error', 'Toutes les méthodes de connexion ont échoué');
    
    return {
      success: false,
      message: "Impossible d'établir la connexion",
      details: { allMethodsFailed: true }
    };
  } catch (error) {
    console.error("[checkAcelleConnectionStatus] Erreur générale:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    await updateAccountStatus(account.id, 'error', errorMessage);
    
    return {
      success: false,
      message: errorMessage,
      details: { generalError: true }
    };
  }
};

/**
 * Met à jour le statut d'un compte dans la base de données
 */
const updateAccountStatus = async (
  accountId: string, 
  status: 'active' | 'inactive' | 'error', 
  errorMessage: string | null
) => {
  try {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'active') {
      updates.last_sync_date = new Date().toISOString();
      updates.last_sync_error = null;
    } else if (status === 'error') {
      updates.last_sync_error = errorMessage;
    }
    
    await supabase
      .from('acelle_accounts')
      .update(updates)
      .eq('id', accountId);
      
    console.log(`[updateAccountStatus] Statut ${status} mis à jour pour compte ${accountId}`);
  } catch (error) {
    console.error("[updateAccountStatus] Erreur mise à jour:", error);
  }
};

/**
 * Teste la connexion avec les paramètres fournis
 */
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  authToken?: string
): Promise<AcelleConnectionDebug> => {
  try {
    console.log(`[testAcelleConnection] Test avec endpoint: ${apiEndpoint}`);
    
    const testUrl = buildCleanAcelleApiUrl(
      "campaigns",
      apiEndpoint,
      { 
        api_token: apiToken,
        page: "1",
        per_page: "1" 
      }
    );
    
    const startTime = Date.now();
    const data = await callDirectAcelleApi(testUrl, { timeout: 8000 });
    const duration = Date.now() - startTime;
    
    if (data && (data.data || data.campaigns)) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration,
        statusCode: 200,
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
    } else {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Réponse API inattendue",
        duration,
        request: {
          url: testUrl.replace(apiToken, '***'),
          method: 'GET'
        }
      };
    }
  } catch (error) {
    console.error("[testAcelleConnection] Erreur:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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
