
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

    return data.map(account => {
      // Create the base account object with consistent property naming
      const accountData: AcelleAccount = {
        id: account.id,
        mission_id: account.mission_id,
        name: account.name,
        api_endpoint: account.api_endpoint,
        api_token: account.api_token,
        last_sync_date: account.last_sync_date,
        status: account.status as AcelleAccount["status"],
        created_at: account.created_at,
        updated_at: account.updated_at,
        cache_priority: account.cache_priority || 0,
        last_sync_error: account.last_sync_error
      };
      
      return accountData;
    });
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
    
    // Create the base account object with consistent property naming
    const accountData: AcelleAccount = {
      id: data.id,
      mission_id: data.mission_id,
      name: data.name,
      api_endpoint: data.api_endpoint,
      api_token: data.api_token,
      last_sync_date: data.last_sync_date,
      status: data.status as AcelleAccount["status"],
      created_at: data.created_at,
      updated_at: data.updated_at,
      cache_priority: data.cache_priority || 0,
      last_sync_error: data.last_sync_error
    };
    
    return accountData;
  } catch (error) {
    console.error(`Error fetching Acelle account ${id}:`, error);
    return null;
  }
};

// Create account
export const createAcelleAccount = async (account: Omit<AcelleAccount, "id" | "created_at" | "updated_at">): Promise<AcelleAccount | null> => {
  try {
    let last_sync_date = null;
    
    if (account.last_sync_date) {
      last_sync_date = account.last_sync_date;
    }
    
    const { data, error } = await supabase
      .from("acelle_accounts")
      .insert({
        mission_id: account.mission_id,
        name: account.name,
        api_endpoint: account.api_endpoint,
        api_token: account.api_token,
        status: account.status,
        last_sync_date: last_sync_date,
        last_sync_error: account.last_sync_error,
        cache_priority: account.cache_priority || 0
      })
      .select()
      .single();
    
    if (error) throw error;

    toast.success("Compte Acelle créé avec succès");
    
    return {
      ...account,
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at
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
    let last_sync_date = null;
    
    if (account.last_sync_date) {
      last_sync_date = account.last_sync_date;
    }
      
    const updateData: Record<string, any> = {
      mission_id: account.mission_id,
      name: account.name,
      api_endpoint: account.api_endpoint,
      api_token: account.api_token,
      status: account.status,
      last_sync_date: last_sync_date,
      last_sync_error: account.last_sync_error,
      cache_priority: account.cache_priority || 0
    };

    const { data, error } = await supabase
      .from("acelle_accounts")
      .update(updateData)
      .eq("id", account.id)
      .select()
      .single();
    
    if (error) throw error;

    toast.success("Compte Acelle mis à jour avec succès");
    
    return {
      ...account,
      updated_at: data.updated_at
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
    const now = new Date().toISOString();
    
    await supabase
      .from("acelle_accounts")
      .update({
        last_sync_date: now
      })
      .eq("id", accountId);
  } catch (error) {
    console.error(`Error updating last sync date for account ${accountId}:`, error);
  }
};
