
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";

/**
 * Vérifie l'état de la connexion en utilisant uniquement les Edge Functions
 */
export const checkAcelleConnectionStatus = async (account: AcelleAccount) => {
  try {
    console.log(`[checkAcelleConnectionStatus] Test connexion pour ${account.name} via Edge Function`);
    
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[checkAcelleConnectionStatus] Informations compte incomplètes");
      
      await updateAccountStatus(account.id, 'error', 'Informations de compte incomplètes');
      
      return {
        success: false,
        message: "Informations de compte incomplètes",
        details: { incomplete: true }
      };
    }

    // Utiliser uniquement l'Edge Function pour éviter les problèmes CORS
    try {
      console.log(`[checkAcelleConnectionStatus] Appel Edge Function`);
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'check_connection'
        }
      });
      
      if (error) {
        console.error("[checkAcelleConnectionStatus] Erreur Edge Function:", error);
        throw new Error(error.message || "Erreur de connexion via Edge Function");
      }
      
      if (data && data.success) {
        console.log(`[checkAcelleConnectionStatus] Edge Function OK pour ${account.name}`);
        
        await updateAccountStatus(account.id, 'active', null);
        
        return {
          success: true,
          message: "Connexion établie via Edge Function",
          details: { 
            method: 'edge_function',
            duration: data.duration,
            apiVersion: data.apiVersion,
            campaignsFound: data.campaignsFound || 0
          }
        };
      } else {
        throw new Error(data?.message || "Connexion échouée");
      }
    } catch (edgeError) {
      console.error(`[checkAcelleConnectionStatus] Edge Function échouée:`, edgeError);
      
      const errorMessage = edgeError instanceof Error ? edgeError.message : String(edgeError);
      await updateAccountStatus(account.id, 'error', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        details: { method: 'edge_function', error: errorMessage }
      };
    }
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
 * Teste la connexion avec les paramètres fournis via Edge Function uniquement
 */
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string
): Promise<AcelleConnectionDebug> => {
  try {
    console.log(`[testAcelleConnection] Test avec endpoint: ${apiEndpoint} via Edge Function`);
    
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: apiEndpoint,
        api_token: apiToken,
        action: 'test_connection'
      }
    });
    
    if (error) {
      throw new Error(error.message || "Erreur de connexion via Edge Function");
    }
    
    if (data && data.success) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        duration: data.duration,
        statusCode: 200,
        apiVersion: data.apiVersion || "Inconnue",
        responseData: {
          campaignsCount: data.campaignsCount || 0,
          totalCampaigns: data.totalCampaigns || 0,
          hasData: !!data.responseData
        },
        request: {
          url: `${apiEndpoint}/campaigns`,
          method: 'GET'
        }
      };
    } else {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: data?.message || "Test de connexion échoué",
        duration: data?.duration,
        request: {
          url: `${apiEndpoint}/campaigns`,
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
