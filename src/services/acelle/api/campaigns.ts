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
      ...campaign,
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null
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
      ...data,
      delivery_date: data.delivery_date || null,
      run_at: data.run_at || null,
      last_error: data.last_error || null
    };
  } catch (error) {
    console.error("Exception lors de la récupération de la campagne Acelle:", error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes depuis Acelle
 */
export const forceSyncCampaigns = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // TODO: Implémenter la logique de synchronisation forcée des campagnes
    console.warn("La synchronisation forcée des campagnes n'est pas encore implémentée.");
    return { success: false, error: "Not implemented" };
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée des campagnes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};
