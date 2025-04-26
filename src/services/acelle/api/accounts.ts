
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { toast } from "sonner";

// Get all Acelle accounts
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
    console.error("Error fetching Acelle accounts:", error);
    return [];
  }
};

// Get account by ID
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
    console.error(`Error fetching Acelle account ${id}:`, error);
    return null;
  }
};

// Create account
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
    console.error("Error creating Acelle account:", error);
    toast.error("Échec de la création du compte Acelle");
    return null;
  }
};

// Update account
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
    console.error(`Error updating Acelle account ${account.id}:`, error);
    toast.error("Échec de la mise à jour du compte Acelle");
    return null;
  }
};

// Delete account
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
    console.error(`Error deleting Acelle account ${id}:`, error);
    toast.error("Échec de la suppression du compte Acelle");
    return false;
  }
};

// Update last sync date
export const updateLastSyncDate = async (accountId: string): Promise<void> => {
  try {
    await supabase
      .from("acelle_accounts")
      .update({
        last_sync_date: new Date().toISOString()
      })
      .eq("id", accountId);
  } catch (error) {
    console.error(`Error updating last sync date for account ${accountId}:`, error);
  }
};

