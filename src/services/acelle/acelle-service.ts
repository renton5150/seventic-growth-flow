
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const getAcelleAccounts = async (): Promise<AcelleAccount[]> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .order('name');
      
    if (error) {
      console.error("Erreur lors de la récupération des comptes Acelle:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Acelle:", error);
    return [];
  }
};

export const createAcelleAccount = async (account: Partial<AcelleAccount>): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .insert({
        name: account.name,
        api_endpoint: account.apiEndpoint,
        api_token: account.apiToken,
        status: account.status || 'inactive',
        mission_id: account.missionId
      })
      .select('*')
      .single();
      
    if (error) {
      console.error("Erreur lors de la création du compte Acelle:", error);
      toast.error(`Erreur: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la création du compte Acelle:", error);
    toast.error("Une erreur est survenue lors de la création du compte");
    return null;
  }
};

export const updateAcelleAccount = async (account: AcelleAccount): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .update({
        name: account.name,
        api_endpoint: account.apiEndpoint,
        api_token: account.apiToken,
        status: account.status,
        mission_id: account.missionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id)
      .select('*')
      .single();
      
    if (error) {
      console.error("Erreur lors de la mise à jour du compte Acelle:", error);
      toast.error(`Erreur: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte Acelle:", error);
    toast.error("Une erreur est survenue lors de la mise à jour du compte");
    return null;
  }
};

export const deleteAcelleAccount = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('acelle_accounts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Erreur lors de la suppression du compte Acelle:", error);
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du compte Acelle:", error);
    toast.error("Une erreur est survenue lors de la suppression du compte");
    return false;
  }
};

export const getAcelleCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    // Utiliser l'Edge Function pour récupérer les campagnes
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'get-campaigns',
        apiEndpoint: account.api_endpoint || account.apiEndpoint,
        apiToken: account.api_token || account.apiToken
      }
    });
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes:", error);
      return [];
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    return [];
  }
};

export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    // Utiliser l'Edge Function pour récupérer les détails de la campagne
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'get-campaign-details',
        apiEndpoint: account.api_endpoint || account.apiEndpoint,
        apiToken: account.api_token || account.apiToken,
        campaignUid
      }
    });
    
    if (error) {
      console.error("Erreur lors de la récupération des détails de la campagne:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la campagne:", error);
    return null;
  }
};

export const testApiConnection = async (apiEndpoint: string, apiToken: string, debug: boolean = false): Promise<boolean | AcelleConnectionDebug> => {
  try {
    const result = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'test-connection',
        apiEndpoint,
        apiToken,
        debug
      }
    });
    
    console.log("Résultat du test de connexion:", result);
    
    if (result.error) {
      console.error("Erreur lors du test de connexion:", result.error);
      if (debug) {
        return {
          success: false,
          errorMessage: result.error.message,
          statusCode: 500,
          request: {
            url: apiEndpoint,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            }
          },
          responseData: null
        };
      }
      return false;
    }
    
    if (debug && result.data.debugInfo) {
      return result.data.debugInfo;
    }
    
    return result.data?.success || false;
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    if (debug) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        statusCode: 500,
        request: {
          url: apiEndpoint,
          method: "GET"
        },
        responseData: null
      };
    }
    return false;
  }
};

// Alias for backward compatibility
export const testAcelleConnection = testApiConnection;

export const pingAcelleEndpoint = async (account: AcelleAccount, endpoint?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'ping',
        apiEndpoint: account.api_endpoint || account.apiEndpoint || endpoint,
        apiToken: account.api_token || account.apiToken
      }
    });
    
    if (error) {
      console.error("Erreur lors du ping de l'endpoint Acelle:", error);
      return false;
    }
    
    return data?.status === 'active' || false;
  } catch (error) {
    console.error("Erreur lors du ping de l'endpoint Acelle:", error);
    return false;
  }
};

export const checkApiAvailability = async (accountId?: string): Promise<{
  available: boolean;
  endpoints?: Record<string, boolean>;
  debugInfo?: AcelleConnectionDebug;
}> => {
  try {
    // Utiliser l'Edge Function pour vérifier la disponibilité
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

export const updateLastSyncDate = async (accountId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('acelle_accounts')
      .update({
        last_sync_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);
      
    if (error) {
      console.error("Erreur lors de la mise à jour de la date de synchronisation:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la date de synchronisation:", error);
    return false;
  }
};

// Alias for backward compatibility
export const syncCampaignsCache = async (account: AcelleAccount) => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
      body: {
        accountId: account.id,
        forceFetch: true
      }
    });
    
    if (error) {
      console.error("Erreur lors de la synchronisation des campagnes:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors de la synchronisation des campagnes:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
};
