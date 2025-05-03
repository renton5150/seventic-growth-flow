
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

        // Vérifier que le compte est défini avant d'appeler l'API
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
  const campaignId = campaign.uid || campaign.campaign_uid || 'unknown';
  console.log(`[extractQuickStats] Extraction pour campagne ${campaignId}`);
  
  // Fonction pour extraire de manière sûre une valeur numérique
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Récupérer le nombre total d'envois
  let totalSent = 0;
  if (campaign.statistics && campaign.statistics.subscriber_count !== undefined) {
    totalSent = safeNumber(campaign.statistics.subscriber_count);
  } else if (campaign.delivery_info && campaign.delivery_info.total !== undefined) {
    totalSent = safeNumber(campaign.delivery_info.total);
  }

  // Récupérer le taux d'ouverture
  let openRate = 0;
  if (campaign.statistics) {
    if (campaign.statistics.uniq_open_rate !== undefined) {
      openRate = safeNumber(campaign.statistics.uniq_open_rate);
    } else if (campaign.statistics.open_rate !== undefined) {
      openRate = safeNumber(campaign.statistics.open_rate);
    } else if (campaign.statistics.open_count !== undefined && campaign.statistics.delivered_count && campaign.statistics.delivered_count > 0) {
      openRate = (safeNumber(campaign.statistics.open_count) / safeNumber(campaign.statistics.delivered_count)) * 100;
    }
  } else if (campaign.delivery_info) {
    if (campaign.delivery_info.unique_open_rate !== undefined) {
      openRate = safeNumber(campaign.delivery_info.unique_open_rate);
    } else if (campaign.delivery_info.opened !== undefined && campaign.delivery_info.delivered && campaign.delivery_info.delivered > 0) {
      openRate = (safeNumber(campaign.delivery_info.opened) / safeNumber(campaign.delivery_info.delivered)) * 100;
    }
  }

  // Récupérer le taux de clic
  let clickRate = 0;
  if (campaign.statistics && campaign.statistics.click_rate !== undefined) {
    clickRate = safeNumber(campaign.statistics.click_rate);
  } else if (campaign.delivery_info && campaign.delivery_info.click_rate !== undefined) {
    clickRate = safeNumber(campaign.delivery_info.click_rate);
  }

  // Récupérer le nombre de bounces
  let bounceCount = 0;
  if (campaign.statistics && campaign.statistics.bounce_count !== undefined) {
    bounceCount = safeNumber(campaign.statistics.bounce_count);
  } else if (campaign.delivery_info && campaign.delivery_info.bounced !== undefined) {
    if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced && campaign.delivery_info.bounced.total !== undefined) {
      bounceCount = safeNumber(campaign.delivery_info.bounced.total);
    } else if (typeof campaign.delivery_info.bounced === 'number') {
      bounceCount = safeNumber(campaign.delivery_info.bounced);
    }
  }

  console.log(`[extractQuickStats] Résultat pour ${campaignId}:`, {
    totalSent, openRate, clickRate, bounceCount
  });

  return {
    totalSent,
    openRate,
    clickRate,
    bounceCount
  };
}
