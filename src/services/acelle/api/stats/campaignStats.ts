
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";
import { ensureValidStatistics } from "./validation";
import { getCachedStatistics, getCachedDeliveryInfo, updateStatisticsCache, updateCampaignCache, testCacheInsertion } from "./cacheManager";
import { fetchStatsFromApi } from "./apiClient";
import { CampaignStatsResult, StatsFetchOptions } from "./types";

/**
 * Récupère et traite les statistiques d'une campagne
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options?: StatsFetchOptions
): Promise<CampaignStatsResult> => {
  // Identifiant de la campagne
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  if (!campaignUid) {
    console.error("Aucun UID de campagne fourni pour la récupération des statistiques");
    return {
      statistics: createEmptyStatistics(),
      delivery_info: {}
    };
  }
  
  try {
    console.log(`[Stats] Début récupération stats pour campagne ${campaignUid}`);
    
    // Vérifier d'abord si les statistiques sont déjà dans le cache
    if (!options?.refresh) {
      // Récupérer depuis le cache des statistiques
      const cachedStats = await getCachedStatistics(campaignUid);
      
      if (cachedStats) {
        // Créer un format unifié pour delivery_info
        const delivery_info = {
          total: cachedStats.subscriber_count || 0,
          delivered: cachedStats.delivered_count || 0,
          delivery_rate: cachedStats.delivered_rate || 0,
          opened: cachedStats.open_count || 0,
          unique_open_rate: cachedStats.uniq_open_rate || 0,
          clicked: cachedStats.click_count || 0,
          click_rate: cachedStats.click_rate || 0,
          bounced: {
            total: cachedStats.bounce_count || 0,
            soft: cachedStats.soft_bounce_count || 0,
            hard: cachedStats.hard_bounce_count || 0
          },
          unsubscribed: cachedStats.unsubscribe_count || 0,
          complained: cachedStats.abuse_complaint_count || 0
        };
        
        return { statistics: cachedStats, delivery_info };
      }
      
      // Fallback sur email_campaigns_cache
      const cachedDeliveryInfo = await getCachedDeliveryInfo(campaignUid);
      
      if (cachedDeliveryInfo) {
        try {
          // Calculer les statistiques à partir de delivery_info
          const statistics: AcelleCampaignStatistics = {
            subscriber_count: cachedDeliveryInfo.total || 0,
            delivered_count: cachedDeliveryInfo.delivered || 0,
            delivered_rate: cachedDeliveryInfo.delivery_rate || 0,
            open_count: cachedDeliveryInfo.opened || 0,
            uniq_open_count: cachedDeliveryInfo.opened || 0,
            uniq_open_rate: cachedDeliveryInfo.unique_open_rate || 0,
            click_count: cachedDeliveryInfo.clicked || 0,
            click_rate: cachedDeliveryInfo.click_rate || 0,
            bounce_count: typeof cachedDeliveryInfo.bounced === 'object' ? 
              (cachedDeliveryInfo.bounced?.total || 0) : 
              (typeof cachedDeliveryInfo.bounced === 'number' ? cachedDeliveryInfo.bounced : 0),
            soft_bounce_count: typeof cachedDeliveryInfo.bounced === 'object' ? 
              (cachedDeliveryInfo.bounced?.soft || 0) : 0,
            hard_bounce_count: typeof cachedDeliveryInfo.bounced === 'object' ? 
              (cachedDeliveryInfo.bounced?.hard || 0) : 0,
            unsubscribe_count: cachedDeliveryInfo.unsubscribed || 0,
            abuse_complaint_count: cachedDeliveryInfo.complained || 0
          };
          
          return { statistics, delivery_info: cachedDeliveryInfo };
        } catch (error) {
          console.error(`[Stats] Erreur lors du traitement des données en cache:`, error);
        }
      }
    }
    
    // Si pas de cache ou refresh demandé, récupérer depuis l'API
    console.log(`[Stats] Appel API pour campagne ${campaignUid}`);
    
    // Vérifier si nous sommes en mode démo
    if (options?.demoMode) {
      const demoStats = createEmptyStatistics();
      demoStats.subscriber_count = 1000;
      demoStats.delivered_count = 980;
      demoStats.delivered_rate = 98;
      demoStats.open_count = 450;
      demoStats.uniq_open_count = 400;
      demoStats.uniq_open_rate = 40;
      demoStats.click_count = 180;
      demoStats.click_rate = 18;
      
      const demoDeliveryInfo = {
        total: demoStats.subscriber_count,
        delivered: demoStats.delivered_count,
        delivery_rate: demoStats.delivered_rate,
        opened: demoStats.open_count,
        unique_open_rate: demoStats.uniq_open_rate,
        clicked: demoStats.click_count,
        click_rate: demoStats.click_rate,
        bounced: {
          total: 20,
          soft: 15,
          hard: 5
        },
        unsubscribed: 10,
        complained: 2
      };
      
      return { statistics: demoStats, delivery_info: demoDeliveryInfo };
    }
    
    // Récupérer depuis l'API
    const statistics = await fetchStatsFromApi(campaignUid, account);
    
    if (!statistics) {
      // En cas d'erreur, essayer d'utiliser les statistiques existantes de la campagne
      if (campaign.statistics) {
        return {
          statistics: campaign.statistics,
          delivery_info: campaign.delivery_info || {}
        };
      }
      
      return {
        statistics: createEmptyStatistics(),
        delivery_info: {}
      };
    }
    
    // Créer un format unifié pour delivery_info
    const delivery_info = {
      total: statistics.subscriber_count,
      delivered: statistics.delivered_count,
      delivery_rate: statistics.delivered_rate,
      opened: statistics.open_count,
      unique_open_rate: statistics.uniq_open_rate,
      clicked: statistics.click_count,
      click_rate: statistics.click_rate,
      bounced: {
        total: statistics.bounce_count,
        soft: statistics.soft_bounce_count,
        hard: statistics.hard_bounce_count
      },
      unsubscribed: statistics.unsubscribe_count,
      complained: statistics.abuse_complaint_count
    };
    
    // Mettre à jour les caches
    if (account?.id) {
      await updateStatisticsCache(campaignUid, account.id, statistics);
      await updateCampaignCache(campaignUid, account.id, delivery_info);
    }
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`[Stats] Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
    
    // En cas d'erreur, essayer d'utiliser les statistiques existantes de la campagne
    if (campaign.statistics) {
      return {
        statistics: campaign.statistics,
        delivery_info: campaign.delivery_info || {}
      };
    }
    
    return {
      statistics: createEmptyStatistics(),
      delivery_info: {}
    };
  }
};

// Exporter les fonctions utilitaires
export {
  testCacheInsertion,
  ensureValidStatistics
};
