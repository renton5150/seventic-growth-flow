
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics } from "@/types/acelle.types";

// Constante pour définir la durée de validité du cache (5 minutes par défaut)
const DEFAULT_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Get cached statistics for a campaign
 */
export async function getCachedStatistics(
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaignStatistics | null> {
  try {
    console.log(`[Stats Cache] Tentative de récupération des statistiques en cache pour ${campaignUid}`);
    
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics, last_updated')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (error || !data) {
      console.log(`[Stats Cache] Aucune statistique en cache pour ${campaignUid}`);
      return null;
    }
    
    console.log(`[Stats Cache] Statistiques trouvées en cache pour ${campaignUid}, dernière mise à jour: ${data.last_updated}`);
    return data.statistics as unknown as AcelleCampaignStatistics;
  } catch (error) {
    console.error('[Stats Cache] Erreur lors de la récupération du cache:', error);
    return null;
  }
}

/**
 * Vérifie si les statistiques en cache sont récentes
 */
export function isCacheValid(lastUpdated: string | null, maxAgeMs: number = DEFAULT_CACHE_MAX_AGE_MS): boolean {
  if (!lastUpdated) return false;
  
  try {
    const lastUpdatedDate = new Date(lastUpdated);
    const now = new Date();
    const ageMs = now.getTime() - lastUpdatedDate.getTime();
    
    return ageMs < maxAgeMs;
  } catch (error) {
    console.error("Erreur lors de la vérification de validité du cache:", error);
    return false;
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
        statistics: statistics as unknown as Record<string, any>,
        last_updated: new Date().toISOString()
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

/**
 * Obtenir le timestamp de dernière mise à jour des statistiques
 */
export async function getLastUpdatedTimestamp(
  campaignUid: string,
  accountId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('last_updated')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (error || !data) {
      return null;
    }
    
    return data.last_updated;
  } catch (error) {
    console.error('[Stats Cache] Erreur lors de la récupération du timestamp:', error);
    return null;
  }
}
