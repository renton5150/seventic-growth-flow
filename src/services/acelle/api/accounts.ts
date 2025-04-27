
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { toast } from "sonner";

export const getAcelleAccounts = async (): Promise<AcelleAccount[]> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching Acelle accounts:", error);
      toast.error("Erreur lors du chargement des comptes Acelle");
      return [];
    }

    console.log(`Retrieved ${data.length} Acelle accounts`);
    return data.map((account: any) => ({
      id: account.id,
      name: account.name,
      api_endpoint: account.api_endpoint,
      api_token: account.api_token,
      status: account.status as "active" | "inactive",
      last_sync_date: account.last_sync_date,
      mission_id: account.mission_id,
      created_at: account.created_at,
      updated_at: account.updated_at,
      
      // For backward compatibility
      apiEndpoint: account.api_endpoint,
      apiToken: account.api_token,
      lastSyncDate: account.last_sync_date,
      missionId: account.mission_id,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      missionName: "" // This can be populated later if needed
    }));
  } catch (error) {
    console.error("Error in getAcelleAccounts:", error);
    toast.error("Erreur lors du chargement des comptes Acelle");
    return [];
  }
};

export const updateAcelleAccount = async (account: AcelleAccount): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .update({
        name: account.name,
        api_endpoint: account.api_endpoint,
        api_token: account.api_token,
        status: account.status,
        mission_id: account.mission_id || account.missionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating Acelle account:", error);
      toast.error("Erreur lors de la mise à jour du compte Acelle");
      return null;
    }

    console.log("Acelle account updated successfully:", data);
    toast.success("Compte Acelle mis à jour avec succès");
    
    return {
      id: data.id,
      name: data.name,
      api_endpoint: data.api_endpoint,
      api_token: data.api_token,
      status: data.status as "active" | "inactive",
      last_sync_date: data.last_sync_date,
      mission_id: data.mission_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      
      // For backward compatibility
      apiEndpoint: data.api_endpoint,
      apiToken: data.api_token,
      lastSyncDate: data.last_sync_date,
      missionId: data.mission_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      missionName: "" // This can be populated later if needed
    };
  } catch (error) {
    console.error("Error in updateAcelleAccount:", error);
    toast.error("Erreur lors de la mise à jour du compte Acelle");
    return null;
  }
};

export const createAcelleAccount = async (account: Partial<AcelleAccount>): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .insert({
        name: account.name,
        api_endpoint: account.api_endpoint,
        api_token: account.api_token,
        status: account.status || 'inactive',
        mission_id: account.mission_id || account.missionId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating Acelle account:", error);
      toast.error("Erreur lors de la création du compte Acelle");
      return null;
    }

    console.log("Acelle account created successfully:", data);
    toast.success("Compte Acelle créé avec succès");
    
    return {
      id: data.id,
      name: data.name,
      api_endpoint: data.api_endpoint,
      api_token: data.api_token,
      status: data.status as "active" | "inactive",
      last_sync_date: data.last_sync_date,
      mission_id: data.mission_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      
      // For backward compatibility
      apiEndpoint: data.api_endpoint,
      apiToken: data.api_token,
      lastSyncDate: data.last_sync_date,
      missionId: data.mission_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      missionName: "" // This can be populated later if needed
    };
  } catch (error) {
    console.error("Error in createAcelleAccount:", error);
    toast.error("Erreur lors de la création du compte Acelle");
    return null;
  }
};

export const deleteAcelleAccount = async (accountId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('acelle_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error("Error deleting Acelle account:", error);
      toast.error("Erreur lors de la suppression du compte Acelle");
      return false;
    }

    console.log("Acelle account deleted successfully");
    toast.success("Compte Acelle supprimé avec succès");
    return true;
  } catch (error) {
    console.error("Error in deleteAcelleAccount:", error);
    toast.error("Erreur lors de la suppression du compte Acelle");
    return false;
  }
};

export const updateLastSyncDate = async (accountId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('acelle_accounts')
      .update({
        last_sync_date: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) {
      console.error("Error updating last sync date:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateLastSyncDate:", error);
    return false;
  }
};
