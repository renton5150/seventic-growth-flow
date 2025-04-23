import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { toast } from "sonner";

// Récupérer tous les comptes Acelle
export const getAcelleAccounts = async (): Promise<AcelleAccount[]> => {
  try {
    const { data, error } = await supabase
      .from("acelle_accounts")
      .select(`
        *,
        missions (name)
      `)
      .order("name");
    
    if (error) throw error;

    return data.map(account => ({
      id: account.id,
      missionId: account.mission_id,
      missionName: account.missions?.name || "Mission inconnue",
      name: account.name,
      apiEndpoint: account.api_endpoint,
      apiToken: account.api_token,
      lastSyncDate: account.last_sync_date,
      status: account.status as AcelleAccount["status"],
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Acelle:", error);
    return [];
  }
};

// Récupérer un compte Acelle par ID
export const getAcelleAccountById = async (id: string): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from("acelle_accounts")
      .select(`
        *,
        missions(name)
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;

    return {
      id: data.id,
      missionId: data.mission_id,
      missionName: data.missions?.name || "Mission inconnue",
      name: data.name,
      apiEndpoint: data.api_endpoint,
      apiToken: data.api_token,
      lastSyncDate: data.last_sync_date,
      status: data.status as AcelleAccount["status"],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du compte Acelle ${id}:`, error);
    return null;
  }
};

// Créer un compte Acelle
export const createAcelleAccount = async (account: Omit<AcelleAccount, "id" | "createdAt" | "updatedAt">): Promise<AcelleAccount | null> => {
  try {
    const lastSyncDate = account.lastSyncDate instanceof Date 
      ? account.lastSyncDate.toISOString() 
      : account.lastSyncDate;
    
    const { data, error } = await supabase
      .from("acelle_accounts")
      .insert({
        mission_id: account.missionId,
        name: account.name,
        api_endpoint: account.apiEndpoint,
        api_token: account.apiToken,
        status: account.status,
        last_sync_date: lastSyncDate
      })
      .select()
      .single();
    
    if (error) throw error;

    toast.success("Compte Acelle créé avec succès");
    
    return {
      ...account,
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error("Erreur lors de la création du compte Acelle:", error);
    toast.error("Échec de la création du compte Acelle");
    return null;
  }
};

// Mettre à jour un compte Acelle
export const updateAcelleAccount = async (account: AcelleAccount): Promise<AcelleAccount | null> => {
  try {
    const lastSyncDate = account.lastSyncDate instanceof Date 
      ? account.lastSyncDate.toISOString() 
      : account.lastSyncDate;
      
    const { data, error } = await supabase
      .from("acelle_accounts")
      .update({
        mission_id: account.missionId,
        name: account.name,
        api_endpoint: account.apiEndpoint,
        api_token: account.apiToken,
        status: account.status,
        last_sync_date: lastSyncDate
      })
      .eq("id", account.id)
      .select()
      .single();
    
    if (error) throw error;

    toast.success("Compte Acelle mis à jour avec succès");
    
    return {
      ...account,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du compte Acelle ${account.id}:`, error);
    toast.error("Échec de la mise à jour du compte Acelle");
    return null;
  }
};

// Supprimer un compte Acelle
export const deleteAcelleAccount = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("acelle_accounts")
      .delete()
      .eq("id", id);
    
    if (error) throw error;

    toast.success("Compte Acelle supprimé avec succès");
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du compte Acelle ${id}:`, error);
    toast.error("Échec de la suppression du compte Acelle");
    return false;
  }
};

// Données de débogage pour la connexion API
export interface AcelleConnectionDebug {
  success: boolean;
  statusCode?: number;
  responseData?: any;
  errorMessage?: string;
  request?: {
    url: string;
    headers: Record<string, string>;
  };
}

// Tester la connexion à l'API Acelle avec mode debug
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  debug: boolean = false
): Promise<boolean | AcelleConnectionDebug> => {
  try {
    const baseEndpoint = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    
    const url = `${baseEndpoint}/me?api_token=${apiToken}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    
    const debugInfo: AcelleConnectionDebug = {
      success: false,
      request: {
        url,
        headers
      }
    };
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      mode: "cors"
    });
    
    if (debug) {
      debugInfo.statusCode = response.status;
      
      try {
        debugInfo.responseData = await response.clone().json();
      } catch (e) {
        debugInfo.responseData = await response.clone().text();
      }
    }
    
    if (!response.ok) {
      if (debug) {
        debugInfo.errorMessage = `Erreur API: ${response.status} ${response.statusText}`;
        return debugInfo;
      }
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    const success = !!data.id;
    
    if (debug) {
      debugInfo.success = success;
      return debugInfo;
    }
    
    return success;
  } catch (error) {
    console.error("Erreur lors du test de connexion à l'API Acelle:", error);
    
    if (debug) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        request: {
          url: `${apiEndpoint}/me?api_token=${apiToken}`,
          headers: { "Accept": "application/json" }
        }
      };
    }
    
    return false;
  }
};

// Récupérer les campagnes d'un compte Acelle
export const getAcelleCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    const response = await fetch(`${account.apiEndpoint}/campaigns?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    await updateLastSyncDate(account.id);
    
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes du compte ${account.id}:`, error);
    return [];
  }
};

// Récupérer les détails d'une campagne
export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    const response = await fetch(`${account.apiEndpoint}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la campagne ${campaignUid}:`, error);
    return null;
  }
};

// Mettre à jour la date de dernière synchronisation
const updateLastSyncDate = async (accountId: string): Promise<void> => {
  try {
    await supabase
      .from("acelle_accounts")
      .update({
        last_sync_date: new Date().toISOString()
      })
      .eq("id", accountId);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la date de synchronisation du compte ${accountId}:`, error);
  }
};

// Export de tous les services
export const acelleService = {
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  testAcelleConnection,
  getAcelleCampaigns,
  getAcelleCampaignDetails
};

export default acelleService;
