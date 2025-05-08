
import { AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère toutes les campagnes d'un compte Acelle
 */
export const getCampaigns = async (): Promise<AcelleCampaign[]> => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes Acelle:", error);
      return [];
    }
    
    return data?.map(campaign => ({
      uid: campaign.campaign_uid, // Ajout du champ uid requis par AcelleCampaign
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || '',
      subject: campaign.subject || '',
      status: campaign.status || '',
      created_at: campaign.created_at || '',
      updated_at: campaign.updated_at || '',
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null,
      delivery_info: campaign.delivery_info || null
    })) || [];
  } catch (error) {
    console.error("Exception lors de la récupération des campagnes Acelle:", error);
    return [];
  }
};

/**
 * Récupère une campagne Acelle par son UID
 */
export const getCampaign = async (uid: string): Promise<AcelleCampaign | null> => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', uid)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération de la campagne Acelle:", error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      uid: data.campaign_uid, // Ajout du champ uid requis par AcelleCampaign
      campaign_uid: data.campaign_uid,
      name: data.name || '',
      subject: data.subject || '',
      status: data.status || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      delivery_date: data.delivery_date || null,
      run_at: data.run_at || null,
      last_error: data.last_error || null,
      delivery_info: data.delivery_info || null
    };
  } catch (error) {
    console.error("Exception lors de la récupération de la campagne Acelle:", error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes depuis Acelle
 */
export const forceSyncCampaigns = async (account = null, token = null, headers = null): Promise<{ success: boolean; message: string; error?: string }> => {
  try {
    // TODO: Implémenter la logique de synchronisation forcée des campagnes
    console.warn("La synchronisation forcée des campagnes n'est pas encore implémentée.");
    return { success: false, message: "Not implemented", error: "Not implemented" };
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée des campagnes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage, error: errorMessage };
  }
};

// Ajouter ces fonctions pour corriger les imports dans useAcelleCampaigns.ts
export const extractCampaignsFromCache = async (accountId: string, options?: any) => {
  console.log("Extracting campaigns from cache for account", accountId);
  
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erreur lors de l'extraction des campagnes du cache:", error);
      return [];
    }
    
    return data?.map(campaign => ({
      uid: campaign.campaign_uid,
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || '',
      subject: campaign.subject || '',
      status: campaign.status || '',
      created_at: campaign.created_at || '',
      updated_at: campaign.updated_at || '',
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null,
      delivery_info: campaign.delivery_info || {}
    })) || [];
  } catch (error) {
    console.error("Exception lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

// Fonction pour obtenir le statut du cache
export const getCacheStatus = async (accountId: string) => {
  try {
    // Get last updated timestamp
    const { data: lastUpdatedData, error: lastUpdatedError } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1)
      .single();
      
    // Get count
    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
      
    if (lastUpdatedError && lastUpdatedError.code !== 'PGRST116') {
      console.error("Erreur lors de la récupération du timestamp:", lastUpdatedError);
    }
    
    if (countError) {
      console.error("Erreur lors du comptage des campagnes:", countError);
    }
    
    return {
      lastUpdated: lastUpdatedData?.cache_updated_at || null,
      count: count || 0
    };
  } catch (error) {
    console.error("Exception lors de la récupération du statut du cache:", error);
    return { lastUpdated: null, count: 0 };
  }
};
