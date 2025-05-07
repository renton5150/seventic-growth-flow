import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from '@/integrations/supabase/client';

/**
 * Crée des statistiques vides pour une campagne
 */
export function createEmptyStatistics(): AcelleCampaignStatistics {
  return {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0,
    open_rate: 0
  };
}

/**
 * Récupère les statistiques d'une campagne depuis le cache
 */
export async function getCampaignStatsFromCache(
  campaignId: string,
  accountId: string
): Promise<AcelleCampaignStatistics | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignId)
      .eq('account_id', accountId)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      return null;
    }
    
    if (data && data.statistics) {
      // Conversion sécurisée avec vérification du type
      const stats = data.statistics as Record<string, any>;
      
      // Création d'un objet correctement typé avec valeurs par défaut si nécessaire
      const typedStats: AcelleCampaignStatistics = {
        subscriber_count: Number(stats.subscriber_count ?? 0),
        delivered_count: Number(stats.delivered_count ?? 0),
        delivered_rate: Number(stats.delivered_rate ?? 0),
        open_count: Number(stats.open_count ?? 0),
        uniq_open_rate: Number(stats.uniq_open_rate ?? 0),
        click_count: Number(stats.click_count ?? 0),
        click_rate: Number(stats.click_rate ?? 0),
        bounce_count: Number(stats.bounce_count ?? 0),
        soft_bounce_count: Number(stats.soft_bounce_count ?? 0),
        hard_bounce_count: Number(stats.hard_bounce_count ?? 0),
        unsubscribe_count: Number(stats.unsubscribe_count ?? 0),
        abuse_complaint_count: Number(stats.abuse_complaint_count ?? 0),
        open_rate: Number(stats.open_rate ?? 0)
      };
      
      return typedStats;
    }
    
    return null;
  } catch (error) {
    console.error("Exception lors de la récupération des stats:", error);
    return null;
  }
}
