
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

/**
 * Récupère une campagne spécifique par son ID
 */
export const fetchCampaignById = async (
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaign | null> => {
  try {
    // Rechercher dans la table email_campaigns_cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .maybeSingle();
    
    if (error) {
      console.error("Erreur lors de la récupération de la campagne:", error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Transformer les données pour correspondre au type AcelleCampaign
    return {
      uid: data.campaign_uid,
      campaign_uid: data.campaign_uid,
      name: data.name,
      subject: data.subject,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      delivery_date: data.delivery_date,
      run_at: data.run_at,
      last_error: data.last_error,
      // Important: transformer delivery_info pour respecter le type DeliveryInfo
      delivery_info: data.delivery_info as any,
      // Autres propriétés nécessaires
    };
  } catch (error) {
    console.error("Exception lors de la récupération de la campagne:", error);
    return null;
  }
};

/**
 * Récupère les campagnes du cache pour une liste de comptes
 * avec support de pagination
 */
export const fetchCampaignsFromCache = async (
  accounts: AcelleAccount[],
  page = 1,
  itemsPerPage = 10
): Promise<AcelleCampaign[]> => {
  try {
    if (!accounts.length) return [];
    
    // Extraire les IDs des comptes
    const accountIds = accounts.map(account => account.id);
    
    // Calcul du décalage pour la pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    // Récupérer les campagnes pour tous les comptes spécifiés avec pagination
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes du cache:", error);
      return [];
    }
    
    // Transformer les données pour correspondre au type AcelleCampaign
    return (data || []).map(item => ({
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name,
      subject: item.subject,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      delivery_date: item.delivery_date,
      run_at: item.run_at,
      last_error: item.last_error,
      // Important: transformer delivery_info pour respecter le type DeliveryInfo
      delivery_info: item.delivery_info as any,
      // Autres propriétés si nécessaires
    }));
  } catch (error) {
    console.error("Exception lors de la récupération des campagnes du cache:", error);
    return [];
  }
};
