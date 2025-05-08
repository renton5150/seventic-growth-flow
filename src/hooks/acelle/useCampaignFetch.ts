
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

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
      delivery_info: item.delivery_info,
      // Autres propriétés si nécessaires
    }));
  } catch (error) {
    console.error("Exception lors de la récupération des campagnes du cache:", error);
    return [];
  }
};
