
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Sauvegarde les statistiques de campagne en cache
 */
export const saveCampaignStatistics = async (
  campaignUid: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        campaign_uid: campaignUid,
        account_id: accountId,
        statistics: statistics as any,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid,account_id'
      });

    if (error) {
      console.error("[saveCampaignStatistics] Erreur:", error);
      throw error;
    }
    
    console.log(`[saveCampaignStatistics] Statistiques sauvegardées pour ${campaignUid}`);
  } catch (error) {
    console.error(`[saveCampaignStatistics] Échec sauvegarde ${campaignUid}:`, error);
    throw error;
  }
};

/**
 * Récupère les statistiques depuis le cache
 */
export const getCachedCampaignStatistics = async (
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaignStatistics | null> => {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error("[getCachedCampaignStatistics] Erreur:", error);
      return null;
    }

    if (data?.statistics) {
      // Validation et conversion sécurisée du type
      const stats = data.statistics as unknown;
      if (typeof stats === 'object' && stats !== null && !Array.isArray(stats)) {
        return stats as AcelleCampaignStatistics;
      }
    }

    return null;
  } catch (error) {
    console.error(`[getCachedCampaignStatistics] Échec ${campaignUid}:`, error);
    return null;
  }
};
