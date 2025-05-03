
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
        
        if (!campaignUid) {
          console.warn("[BatchFetch] Campagne sans UID valide", campaign);
          return;
        }
        
        // Si la campagne a déjà des statistiques complètes et qu'on ne force pas la mise à jour
        if (!force && campaign.statistics && Object.keys(campaign.statistics).length > 0) {
          console.log(`[BatchFetch] Utilisation des stats existantes pour ${campaignUid}`, campaign.statistics);
          statsMap.set(campaignUid, campaign.statistics);
          return;
        }

        // CORRECTION: Vérifier que le compte est défini avant d'appeler l'API
        if (!account && !demoMode) {
          console.warn(`[BatchFetch] Compte non défini pour ${campaignUid}, impossible de récupérer les stats`);
          return;
        }

        console.log(`[BatchFetch] Récupération des stats pour ${campaignUid}`);
        const result = await fetchAndProcessCampaignStats(campaign, account!, { demoMode });
        
        if (result && result.statistics) {
          statsMap.set(campaignUid, result.statistics);
          
          // Mettre à jour directement la campagne pour une utilisation ultérieure
          campaign.statistics = result.statistics;
          campaign.delivery_info = result.delivery_info;
          
          console.log(`[BatchFetch] Stats récupérées pour ${campaignUid}:`, result.statistics);
        } else {
          console.warn(`[BatchFetch] Pas de statistiques valides pour ${campaignUid}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques pour la campagne:`, error);
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
  console.log(`[ExtractQuickStats] Extraction pour campagne ${campaign.uid || campaign.campaign_uid}`, {
    hasStats: !!campaign.statistics,
    hasDeliveryInfo: !!campaign.delivery_info,
    stats: campaign.statistics,
    delivery_info: campaign.delivery_info
  });

  // CORRECTION: Récupérer les statistiques formattées en privilégiant les sources les plus fiables
  const getTotalSent = (): number => {
    if (campaign.statistics && typeof campaign.statistics.subscriber_count === 'number') 
      return campaign.statistics.subscriber_count;
    if (campaign.delivery_info && typeof campaign.delivery_info.total === 'number') 
      return campaign.delivery_info.total;
    return 0;
  };

  const getOpenRate = (): number => {
    if (campaign.statistics && typeof campaign.statistics.uniq_open_rate === 'number') 
      return campaign.statistics.uniq_open_rate;
    if (campaign.statistics && typeof campaign.statistics.open_rate === 'number') 
      return campaign.statistics.open_rate;
    if (campaign.delivery_info && typeof campaign.delivery_info.unique_open_rate === 'number') 
      return campaign.delivery_info.unique_open_rate;
    
    // Calculer le taux si nous avons les valeurs absolues
    const delivered = campaign.statistics?.delivered_count || 
                     (campaign.delivery_info && typeof campaign.delivery_info.delivered === 'number' ? 
                     campaign.delivery_info.delivered : 0);
    const opened = campaign.statistics?.open_count || 
                  (campaign.delivery_info && typeof campaign.delivery_info.opened === 'number' ? 
                  campaign.delivery_info.opened : 0);
    
    if (delivered > 0) return (opened / delivered) * 100;
    return 0;
  };

  const getClickRate = (): number => {
    if (campaign.statistics && typeof campaign.statistics.click_rate === 'number') 
      return campaign.statistics.click_rate;
    if (campaign.delivery_info && typeof campaign.delivery_info.click_rate === 'number') 
      return campaign.delivery_info.click_rate;
    
    // Calculer le taux si nous avons les valeurs absolues
    const delivered = campaign.statistics?.delivered_count || 
                     (campaign.delivery_info && typeof campaign.delivery_info.delivered === 'number' ? 
                     campaign.delivery_info.delivered : 0);
    const clicked = campaign.statistics?.click_count || 
                   (campaign.delivery_info && typeof campaign.delivery_info.clicked === 'number' ? 
                   campaign.delivery_info.clicked : 0);
    
    if (delivered > 0) return (clicked / delivered) * 100;
    return 0;
  };

  const getBounceCount = (): number => {
    if (campaign.statistics && typeof campaign.statistics.bounce_count === 'number') 
      return campaign.statistics.bounce_count;
    
    if (campaign.delivery_info && campaign.delivery_info.bounced) {
      if (typeof campaign.delivery_info.bounced === 'object' && 
          campaign.delivery_info.bounced.total !== undefined && 
          typeof campaign.delivery_info.bounced.total === 'number') {
        return campaign.delivery_info.bounced.total;
      }
      if (typeof campaign.delivery_info.bounced === 'number') {
        return campaign.delivery_info.bounced;
      }
    }
    
    return 0;
  };

  const result = {
    totalSent: getTotalSent(),
    openRate: getOpenRate(),
    clickRate: getClickRate(),
    bounceCount: getBounceCount()
  };
  
  console.log(`[ExtractQuickStats] Résultat:`, result);
  return result;
}
