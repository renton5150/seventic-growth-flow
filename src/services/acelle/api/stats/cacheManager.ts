
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Get cached statistics for a campaign
 */
export async function getCachedStatistics(
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaignStatistics | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (error || !data) {
      console.log(`[Stats Cache] Aucune statistique en cache pour ${campaignUid}`);
      return null;
    }
    
    console.log(`[Stats Cache] Statistiques trouvées en cache pour ${campaignUid}`);
    return data.statistics as unknown as AcelleCampaignStatistics;
  } catch (error) {
    console.error('[Stats Cache] Erreur lors de la récupération du cache:', error);
    return null;
  }
}

/**
 * Save campaign statistics to cache
 */
export async function saveCampaignStatistics(
  campaignUid: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        campaign_uid: campaignUid,
        account_id: accountId,
        statistics: statistics as unknown as Record<string, any>
      }, { 
        onConflict: 'campaign_uid,account_id' 
      });
      
    if (error) {
      console.error('[Stats Cache] Erreur lors de la sauvegarde des statistiques:', error);
      return false;
    }
    
    console.log(`[Stats Cache] Statistiques sauvegardées en cache pour ${campaignUid}`);
    return true;
  } catch (error) {
    console.error('[Stats Cache] Erreur lors de la sauvegarde du cache:', error);
    return false;
  }
}
