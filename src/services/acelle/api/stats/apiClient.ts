
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les statistiques d'une campagne via Edge Functions uniquement
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchCampaignStatisticsFromApi] Début pour ${campaignUid}`);
    
    if (!campaignUid || !account?.api_token || !account?.api_endpoint) {
      console.error("[fetchCampaignStatisticsFromApi] Paramètres manquants");
      return null;
    }
    
    // Méthode 1: Via acelle-stats-test
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative via acelle-stats-test`);
      
      const { data, error } = await supabase.functions.invoke('acelle-stats-test', {
        body: { 
          campaignId: campaignUid, 
          accountId: account.id, 
          forceRefresh: 'true'
        }
      });
      
      if (!error && data?.success && data.stats) {
        console.log(`[fetchCampaignStatisticsFromApi] Succès acelle-stats-test`);
        return ensureValidStatistics(data.stats);
      }
      
      if (error) {
        console.warn(`[fetchCampaignStatisticsFromApi] Erreur acelle-stats-test:`, error);
      }
    } catch (edgeError) {
      console.warn(`[fetchCampaignStatisticsFromApi] acelle-stats-test échouée:`, edgeError);
    }
    
    // Méthode 2: Via acelle-proxy
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative via acelle-proxy`);
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'get_campaign_stats',
          campaign_uid: campaignUid
        }
      });
      
      if (!error && data?.success) {
        console.log(`[fetchCampaignStatisticsFromApi] Succès acelle-proxy`);
        
        // Extraire les statistiques
        let stats = data.statistics || data.campaign?.statistics || data.campaign || null;
        
        if (stats) {
          return ensureValidStatistics(stats);
        }
      }
      
      if (error) {
        console.error(`[fetchCampaignStatisticsFromApi] Erreur acelle-proxy:`, error);
      }
    } catch (proxyError) {
      console.error(`[fetchCampaignStatisticsFromApi] acelle-proxy échoué:`, proxyError);
    }
    
    console.error(`[fetchCampaignStatisticsFromApi] Toutes les méthodes ont échoué pour ${campaignUid}`);
    return null;
  } catch (error) {
    console.error(`[fetchCampaignStatisticsFromApi] Erreur générale:`, error);
    return null;
  }
};

/**
 * Méthode legacy maintenue pour compatibilité
 */
export const fetchCampaignStatisticsLegacy = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  console.log(`[fetchCampaignStatisticsLegacy] Redirection vers méthode principale pour ${campaignUid}`);
  return fetchCampaignStatisticsFromApi(campaignUid, account);
};
