
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
        if (!force && campaign.statistics && campaign.statistics.subscriber_count !== undefined) {
          console.log(`[BatchFetch] Utilisation des stats existantes pour ${campaignUid}`);
          statsMap.set(campaignUid, campaign.statistics);
          return;
        }

        // Si la campagne a des delivery_info mais pas de statistiques complètes, les convertir
        if (!force && !campaign.statistics && campaign.delivery_info) {
          console.log(`[BatchFetch] Conversion des delivery_info en statistics pour ${campaignUid}`);
          // Créer des statistiques à partir des delivery_info
          const stats: AcelleCampaignStatistics = {
            subscriber_count: Number(campaign.delivery_info.total) || 0,
            delivered_count: Number(campaign.delivery_info.delivered) || 0,
            delivered_rate: Number(campaign.delivery_info.delivery_rate) || 0,
            open_count: Number(campaign.delivery_info.opened) || 0,
            uniq_open_rate: Number(campaign.delivery_info.unique_open_rate) || 0,
            click_count: Number(campaign.delivery_info.clicked) || 0,
            click_rate: Number(campaign.delivery_info.click_rate) || 0,
            bounce_count: typeof campaign.delivery_info.bounced === 'number' 
              ? campaign.delivery_info.bounced 
              : (campaign.delivery_info.bounced?.total || 0),
            soft_bounce_count: typeof campaign.delivery_info.bounced === 'object' ? campaign.delivery_info.bounced?.soft || 0 : 0,
            hard_bounce_count: typeof campaign.delivery_info.bounced === 'object' ? campaign.delivery_info.bounced?.hard || 0 : 0,
            unsubscribe_count: Number(campaign.delivery_info.unsubscribed) || 0,
            abuse_complaint_count: Number(campaign.delivery_info.complained) || 0
          };
          
          campaign.statistics = stats;
          statsMap.set(campaignUid, stats);
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

  // Récupérer les valeurs, priorité aux statistiques puis fallback sur delivery_info
  let totalSent = 0;
  let openRate = 0;
  let clickRate = 0;
  let bounceCount = 0;
  
  // Priorité aux statistiques complètes
  if (campaign.statistics) {
    totalSent = safeNumber(campaign.statistics.subscriber_count);
    openRate = safeNumber(campaign.statistics.uniq_open_rate);
    clickRate = safeNumber(campaign.statistics.click_rate);
    bounceCount = safeNumber(campaign.statistics.bounce_count);
  } 
  // Fallback sur delivery_info
  else if (campaign.delivery_info) {
    totalSent = safeNumber(campaign.delivery_info.total);
    openRate = safeNumber(campaign.delivery_info.unique_open_rate);
    clickRate = safeNumber(campaign.delivery_info.click_rate);
    
    // Traiter les différents cas pour bounced
    if (typeof campaign.delivery_info.bounced === 'number') {
      bounceCount = campaign.delivery_info.bounced;
    } else if (campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object') {
      bounceCount = safeNumber(campaign.delivery_info.bounced.total);
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
