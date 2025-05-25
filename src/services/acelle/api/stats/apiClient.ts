
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { supabase } from "@/integrations/supabase/client";
import { extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Récupère les statistiques d'une campagne via Edge Functions uniquement
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchCampaignStatisticsFromApi] Début pour campagne ${campaignUid} via Edge Function`);
    
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("[fetchCampaignStatisticsFromApi] Paramètres manquants");
      return null;
    }
    
    // Méthode 1: Via edge function dédiée aux statistiques
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative via acelle-stats-test`);
      
      const { data: statsData, error: statsError } = await supabase.functions.invoke('acelle-stats-test', {
        body: { 
          campaignId: campaignUid, 
          accountId: account.id, 
          forceRefresh: 'true',
          debug: 'false'
        }
      });
      
      if (!statsError && statsData && statsData.success && statsData.stats) {
        console.log(`[fetchCampaignStatisticsFromApi] acelle-stats-test OK pour ${campaignUid}`);
        return ensureValidStatistics(statsData.stats);
      }
      
      if (statsError) {
        console.warn(`[fetchCampaignStatisticsFromApi] Erreur acelle-stats-test:`, statsError);
      }
    } catch (edgeError) {
      console.warn(`[fetchCampaignStatisticsFromApi] acelle-stats-test échouée pour ${campaignUid}:`, edgeError);
    }
    
    // Méthode 2: Via acelle-proxy pour récupérer la campagne complète
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative via acelle-proxy`);
      
      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'get_campaign_stats',
          campaign_uid: campaignUid
        }
      });
      
      if (!proxyError && proxyData && proxyData.success) {
        console.log(`[fetchCampaignStatisticsFromApi] acelle-proxy OK pour ${campaignUid}`);
        
        // Extraire les statistiques depuis différents formats possibles
        let stats = null;
        if (proxyData.statistics) {
          stats = extractStatisticsFromAnyFormat(proxyData.statistics);
        } else if (proxyData.campaign && proxyData.campaign.statistics) {
          stats = extractStatisticsFromAnyFormat(proxyData.campaign.statistics);
        } else if (proxyData.campaign) {
          stats = extractStatisticsFromAnyFormat(proxyData.campaign);
        } else if (proxyData.data) {
          stats = extractStatisticsFromAnyFormat(proxyData.data);
        }
        
        if (stats) {
          return ensureValidStatistics(stats);
        }
      }
      
      if (proxyError) {
        console.error(`[fetchCampaignStatisticsFromApi] Erreur acelle-proxy:`, proxyError);
      }
    } catch (proxyError) {
      console.error(`[fetchCampaignStatisticsFromApi] acelle-proxy échoué pour ${campaignUid}:`, proxyError);
    }
    
    console.error(`[fetchCampaignStatisticsFromApi] Toutes les méthodes ont échoué pour ${campaignUid}`);
    return null;
  } catch (error) {
    console.error(`[fetchCampaignStatisticsFromApi] Erreur générale pour ${campaignUid}:`, error);
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
