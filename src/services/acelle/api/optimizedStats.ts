
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./campaignStats";

export interface BatchFetchOptions {
  demoMode?: boolean;
  force?: boolean;
}

/**
 * Fonction optimisée pour récupérer les statistiques pour plusieurs campagnes en parallèle
 */
export async function batchFetchCampaignStats(
  campaigns: AcelleCampaign[],
  account: AcelleAccount | null,
  options: BatchFetchOptions = {}
): Promise<Map<string, AcelleCampaignStatistics>> {
  if (!campaigns.length) {
    return new Map();
  }

  console.log(`[BatchFetch] Récupération des statistiques pour ${campaigns.length} campagnes`);
  const statsMap = new Map<string, AcelleCampaignStatistics>();
  const { demoMode = false, force = false } = options;

  try {
    // Créer un tableau de promesses pour toutes les campagnes
    const fetchPromises = campaigns.map(async (campaign) => {
      try {
        const campaignUid = campaign.uid || campaign.campaign_uid || '';
        
        // Si la campagne a déjà des statistiques complètes et qu'on ne force pas la mise à jour
        if (!force && campaign.statistics && Object.keys(campaign.statistics).length > 0) {
          statsMap.set(campaignUid, campaign.statistics);
          return;
        }

        const result = await fetchAndProcessCampaignStats(campaign, account!, { demoMode });
        
        if (result.statistics) {
          statsMap.set(campaignUid, result.statistics);
          
          // Mettre à jour directement la campagne pour une utilisation ultérieure
          campaign.statistics = result.statistics;
          campaign.delivery_info = result.delivery_info;
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaign.name}:`, error);
      }
    });

    // Exécuter toutes les promesses en parallèle
    await Promise.all(fetchPromises);
    
    console.log(`[BatchFetch] ${statsMap.size}/${campaigns.length} statistiques récupérées avec succès`);
    return statsMap;
  } catch (error) {
    console.error("[BatchFetch] Erreur lors de la récupération par lot des statistiques:", error);
    return statsMap;
  }
}

/**
 * Fonction optimisée pour récupérer les statistiques les plus importantes rapidement
 */
export function extractQuickStats(campaign: AcelleCampaign): {
  totalSent: number;
  openRate: number;
  clickRate: number;
  bounceCount: number;
} {
  // Récupérer les statistiques formattées en privilégiant les sources les plus fiables
  const getTotalSent = (): number => {
    if (campaign.statistics?.subscriber_count) return campaign.statistics.subscriber_count;
    if (campaign.delivery_info?.total) return campaign.delivery_info.total;
    return 0;
  };

  const getOpenRate = (): number => {
    if (campaign.statistics?.uniq_open_rate) return campaign.statistics.uniq_open_rate;
    if (campaign.statistics?.open_rate) return campaign.statistics.open_rate;
    if (campaign.delivery_info?.unique_open_rate) return campaign.delivery_info.unique_open_rate;
    return 0;
  };

  const getClickRate = (): number => {
    if (campaign.statistics?.click_rate) return campaign.statistics.click_rate;
    if (campaign.delivery_info?.click_rate) return campaign.delivery_info.click_rate;
    return 0;
  };

  const getBounceCount = (): number => {
    if (campaign.statistics?.bounce_count) return campaign.statistics.bounce_count;
    
    if (campaign.delivery_info?.bounced) {
      if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced.total) {
        return campaign.delivery_info.bounced.total;
      }
      if (typeof campaign.delivery_info.bounced === 'number') {
        return campaign.delivery_info.bounced;
      }
    }
    
    return 0;
  };

  return {
    totalSent: getTotalSent(),
    openRate: getOpenRate(),
    clickRate: getClickRate(),
    bounceCount: getBounceCount()
  };
}
