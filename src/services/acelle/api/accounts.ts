
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère tous les comptes Acelle
 */
export const getAcelleAccounts = async (): Promise<AcelleAccount[]> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .order('cache_priority', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des comptes Acelle:", error);
      return [];
    }
    
    return data?.map(account => ({
      ...account,
      status: account.status as 'active' | 'inactive' | 'error'
    })) || [];
  } catch (error) {
    console.error("Exception lors de la récupération des comptes Acelle:", error);
    return [];
  }
};

/**
 * Récupère un compte Acelle par son ID
 */
export const getAcelleAccountById = async (id: string): Promise<AcelleAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error("Erreur lors de la récupération du compte Acelle:", error);
      return null;
    }
    
    return {
      ...data,
      status: data.status as 'active' | 'inactive' | 'error'
    };
  } catch (error) {
    console.error("Exception lors de la récupération du compte Acelle:", error);
    return null;
  }
};

/**
 * Crée un nouveau compte Acelle
 */
export const createAcelleAccount = async (
  accountData: Omit<AcelleAccount, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: AcelleAccount; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .insert([{
        ...accountData,
        status: accountData.status || 'inactive',
        cache_priority: accountData.cache_priority || 0
      }])
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: {
        ...data,
        status: data.status as 'active' | 'inactive' | 'error'
      } 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Met à jour un compte Acelle existant
 */
export const updateAcelleAccount = async (
  id: string,
  accountData: Partial<AcelleAccount>
): Promise<{ success: boolean; data?: AcelleAccount; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('acelle_accounts')
      .update(accountData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: {
        ...data,
        status: data.status as 'active' | 'inactive' | 'error'
      } 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Supprime un compte Acelle
 */
export const deleteAcelleAccount = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('acelle_accounts')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Récupère le compte Acelle actif
 */
export const getActiveAccount = async (): Promise<AcelleAccount | null> => {
  try {
    const accounts = await getAcelleAccounts();
    return accounts.find(acc => acc.status === 'active') || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du compte actif:", error);
    return null;
  }
};
