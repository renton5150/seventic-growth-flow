import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { buildAcelleApiUrl, callAcelleApi } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";

/**
 * Crée des statistiques de campagne vides
 */
export const createEmptyStatistics = (): AcelleCampaignStatistics => ({
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
  abuse_complaint_count: 0
});

/**
 * Crée des statistiques de démonstration
 */
export const createDemoStats = (campaign: AcelleCampaign): {
  statistics: AcelleCampaignStatistics;
  delivery_info: DeliveryInfo;
} => {
  const subscriberCount = Math.floor(Math.random() * 10000) + 100;
  const openRate = Math.random() * 0.7;
  const clickRate = Math.random() * 0.3;
  const bounceRate = 0.03;

  const statistics: AcelleCampaignStatistics = {
    subscriber_count: subscriberCount,
    delivered_count: subscriberCount - Math.floor(subscriberCount * bounceRate),
    delivered_rate: 1 - bounceRate,
    open_count: Math.floor(subscriberCount * openRate),
    uniq_open_rate: openRate,
    click_count: Math.floor(subscriberCount * clickRate),
    click_rate: clickRate,
    bounce_count: Math.floor(subscriberCount * bounceRate),
    soft_bounce_count: Math.floor(subscriberCount * bounceRate / 2),
    hard_bounce_count: Math.floor(subscriberCount * bounceRate / 2),
    unsubscribe_count: Math.floor(subscriberCount * 0.005),
    abuse_complaint_count: Math.floor(subscriberCount * 0.002)
  };

  const delivery_info: DeliveryInfo = {
    total: subscriberCount,
    delivered: subscriberCount - Math.floor(subscriberCount * bounceRate),
    opened: Math.floor(subscriberCount * openRate),
    clicked: Math.floor(subscriberCount * clickRate),
    bounced: Math.floor(subscriberCount * bounceRate),
    delivery_rate: 1 - bounceRate,
    unique_open_rate: openRate,
    click_rate: clickRate
  };

  console.log(`[DemoStats] Statistiques générées pour ${campaign.name}:`, { statistics, delivery_info });

  return { statistics, delivery_info };
};

/**
 * Vérifie si le cache est toujours frais
 */
const isCacheFresh = (lastUpdated: string | undefined, maxAge: number): boolean => {
  if (!lastUpdated) return false;
  const lastUpdatedDate = new Date(lastUpdated);
  const now = Date.now();
  return now - lastUpdatedDate.getTime() < maxAge;
};

/**
 * Récupère et traite les statistiques d'une campagne
 * avec gestion intelligente du cache
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount | null,
  options?: {
    refresh?: boolean;
    demoMode?: boolean;
  }
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: DeliveryInfo;
  lastUpdated?: string;
}> => {
  // Données par défaut
  const emptyStats = createEmptyStatistics();
  const emptyDeliveryInfo = {};
  
  try {
    // Mode démo: renvoyer des statistiques fictives
    if (options?.demoMode) {
      console.log("Génération de statistiques de démonstration pour", campaign.name || campaign.uid);
      return createDemoStats(campaign);
    }
    
    // Vérifier les identifiants de campagne
    const campaignUid = campaign.uid || campaign.campaign_uid;
    if (!campaignUid) {
      console.error("Impossible de récupérer les statistiques: UID de campagne manquant");
      return { 
        statistics: emptyStats,
        delivery_info: emptyDeliveryInfo
      };
    }
    
    console.log(`Traitement des statistiques pour la campagne ${campaign.name || campaignUid}`);

    if (!options?.refresh) {
      // 1) Vérifier d'abord si nous avons des stats en cache Supabase
      try {
        // Récupération depuis la table de cache des statistiques
        const { data: cachedStats, error } = await supabase
          .from('campaign_stats_cache')
          .select('statistics, last_updated')
          .eq('campaign_uid', campaignUid)
          .single();
          
        if (!error && cachedStats && cachedStats.statistics) {
          console.log(`Statistiques trouvées en cache pour ${campaignUid}`);
          
          // Vérifier la fraîcheur des données (max 4 heures)
          const lastUpdated = cachedStats.last_updated;
          const isStillFresh = isCacheFresh(lastUpdated, 4 * 60 * 60 * 1000); // 4 heures
          
          if (isStillFresh) {
            console.log(`Cache frais pour ${campaignUid}, utilisation des données en cache`);
            return {
              statistics: cachedStats.statistics as AcelleCampaignStatistics,
              delivery_info: campaign.delivery_info || {},
              lastUpdated
            };
          } else {
            console.log(`Cache expiré pour ${campaignUid}, rafraîchissement nécessaire`);
          }
        } else {
          console.log(`Aucune donnée en cache pour ${campaignUid}`);
        }
      } catch (cacheError) {
        console.warn(`Erreur d'accès au cache pour ${campaignUid}:`, cacheError);
      }
    }
    
    // 2) Si pas de cache ou rafraîchissement demandé, récupérer depuis l'API
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error(`Impossible d'appeler l'API: informations de compte Acelle incomplètes`);
      
      // Si nous avons des statistiques dans la campagne, les utiliser comme fallback
      if (campaign.statistics || campaign.delivery_info) {
        console.log(`Utilisation des statistiques existantes pour ${campaignUid} comme fallback`);
        return {
          statistics: campaign.statistics || emptyStats,
          delivery_info: campaign.delivery_info || emptyDeliveryInfo
        };
      }
      
      return {
        statistics: emptyStats,
        delivery_info: emptyDeliveryInfo
      };
    }
    
    // Essayer d'obtenir les statistiques directement via l'API
    try {
      // URL direct pour les statistiques de la campagne
      const url = buildAcelleApiUrl(account, `campaigns/${campaignUid}/overview`);
      console.log(`Appel direct à l'API pour les statistiques de ${campaignUid}: ${url}`);
      
      const response = await callAcelleApi(url, {}, 3); // 3 tentatives max
      
      if (response && response.data) {
        console.log(`Statistiques reçues pour ${campaignUid}:`, response.data);
        
        const statsData = response.data;
        
        // Structurer les statistiques selon le format attendu
        const statistics = {
          subscriber_count: statsData.subscribers_count || 0,
          delivered_count: statsData.recipients_count || 0,
          delivered_rate: statsData.delivery_rate ? statsData.delivery_rate / 100 : 0,
          open_count: statsData.unique_opens_count || 0,
          uniq_open_count: statsData.unique_opens_count || 0,
          uniq_open_rate: statsData.unique_opens_rate ? statsData.unique_opens_rate / 100 : 0,
          click_count: statsData.unique_clicks_count || 0,
          click_rate: statsData.clicks_rate ? statsData.clicks_rate / 100 : 0,
          bounce_count: (statsData.bounce_count || 0),
          soft_bounce_count: (statsData.soft_bounce_count || 0),
          hard_bounce_count: (statsData.hard_bounce_count || 0),
          unsubscribe_count: (statsData.unsubscribe_count || 0),
          abuse_complaint_count: (statsData.feedback_count || 0)
        };
        
        // Structurer les delivery_info
        const delivery_info = {
          total: statsData.subscribers_count || 0,
          delivered: statsData.recipients_count || 0,
          opened: statsData.unique_opens_count || 0,
          clicked: statsData.unique_clicks_count || 0,
          bounced: {
            total: (statsData.bounce_count || 0),
            hard: (statsData.hard_bounce_count || 0),
            soft: (statsData.soft_bounce_count || 0)
          },
          delivery_rate: statsData.delivery_rate ? statsData.delivery_rate / 100 : 0,
          unique_open_rate: statsData.unique_opens_rate ? statsData.unique_opens_rate / 100 : 0,
          click_rate: statsData.clicks_rate ? statsData.clicks_rate / 100 : 0,
          unsubscribed: (statsData.unsubscribe_count || 0),
          complained: (statsData.feedback_count || 0)
        };
        
        // Mise à jour du cache des statistiques
        try {
          await supabase
            .from('campaign_stats_cache')
            .upsert({
              campaign_uid: campaignUid,
              statistics: statistics,
              last_updated: new Date().toISOString()
            }, { 
              onConflict: 'campaign_uid' 
            });
          console.log(`Cache des statistiques mis à jour pour ${campaignUid}`);
        } catch (cacheError) {
          console.warn(`Erreur lors de la mise à jour du cache pour ${campaignUid}:`, cacheError);
        }
        
        return {
          statistics,
          delivery_info,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (apiError) {
      console.error(`Erreur lors de l'appel API pour ${campaignUid}:`, apiError);
    }
    
    // 3) Si l'API échoue, essayer de récupérer des statistiques depuis les données de la campagne
    // ou d'autres sources de données
    console.log(`Tentative de récupération de statistiques alternatives pour ${campaignUid}`);
    
    // Si la campagne a des statistiques, les utiliser
    if (campaign.statistics) {
      console.log(`Utilisation des statistiques existantes dans la campagne pour ${campaignUid}`);
      return {
        statistics: campaign.statistics,
        delivery_info: campaign.delivery_info || emptyDeliveryInfo
      };
    }
    
    // Si la campagne a des delivery_info, extraire des statistiques
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      console.log(`Extraction de statistiques depuis delivery_info pour ${campaignUid}`);
      
      // Essayer de récupérer depuis email_campaigns_cache
      try {
        const { data: cachedCampaign } = await supabase
          .from('email_campaigns_cache')
          .select('delivery_info, cache_updated_at')
          .eq('campaign_uid', campaignUid)
          .single();
          
        if (cachedCampaign && cachedCampaign.delivery_info) {
          console.log(`Données de cache trouvées pour ${campaignUid}`);
          
          const deliveryInfo = typeof cachedCampaign.delivery_info === 'string' 
            ? JSON.parse(cachedCampaign.delivery_info) 
            : cachedCampaign.delivery_info;
          
          const bouncedInfo = (
            deliveryInfo && 
            typeof deliveryInfo === 'object' && 
            deliveryInfo.bounced && 
            typeof deliveryInfo.bounced === 'object'
          ) ? deliveryInfo.bounced : { soft: 0, hard: 0, total: 0 };
          
          const statistics: AcelleCampaignStatistics = {
            subscriber_count: typeof deliveryInfo.total === 'number' ? deliveryInfo.total : 0,
            delivered_count: typeof deliveryInfo.delivered === 'number' ? deliveryInfo.delivered : 0,
            delivered_rate: typeof deliveryInfo.delivery_rate === 'number' ? deliveryInfo.delivery_rate : 0,
            open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
            uniq_open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
            uniq_open_rate: typeof deliveryInfo.unique_open_rate === 'number' ? deliveryInfo.unique_open_rate : 0,
            click_count: typeof deliveryInfo.clicked === 'number' ? deliveryInfo.clicked : 0,
            click_rate: typeof deliveryInfo.click_rate === 'number' ? deliveryInfo.click_rate : 0,
            bounce_count: typeof bouncedInfo.total === 'number' ? bouncedInfo.total : 0,
            soft_bounce_count: typeof bouncedInfo.soft === 'number' ? bouncedInfo.soft : 0,
            hard_bounce_count: typeof bouncedInfo.hard === 'number' ? bouncedInfo.hard : 0,
            unsubscribe_count: typeof deliveryInfo.unsubscribed === 'number' ? deliveryInfo.unsubscribed : 0,
            abuse_complaint_count: typeof deliveryInfo.complained === 'number' ? deliveryInfo.complained : 0
          };
          
          return {
            statistics,
            delivery_info: deliveryInfo,
            lastUpdated: cachedCampaign.cache_updated_at
          };
        }
      } catch (dbError) {
        console.warn(`Erreur lors de l'accès à la base de données pour ${campaignUid}:`, dbError);
      }
      
      // Extraction des informations de delivery_info de la campagne
      const deliveryInfo = campaign.delivery_info;
      
      const bouncedInfo = (
        deliveryInfo && 
        typeof deliveryInfo === 'object' && 
        deliveryInfo.bounced && 
        typeof deliveryInfo.bounced === 'object'
      ) ? deliveryInfo.bounced : { soft: 0, hard: 0, total: 0 };
      
      const extractedStats: AcelleCampaignStatistics = {
        subscriber_count: typeof deliveryInfo.total === 'number' ? deliveryInfo.total : 0,
        delivered_count: typeof deliveryInfo.delivered === 'number' ? deliveryInfo.delivered : 0,
        delivered_rate: typeof deliveryInfo.delivery_rate === 'number' ? deliveryInfo.delivery_rate : 0,
        open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
        uniq_open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
        uniq_open_rate: typeof deliveryInfo.unique_open_rate === 'number' ? deliveryInfo.unique_open_rate : 0,
        click_count: typeof deliveryInfo.clicked === 'number' ? deliveryInfo.clicked : 0,
        click_rate: typeof deliveryInfo.click_rate === 'number' ? deliveryInfo.click_rate : 0,
        bounce_count: typeof bouncedInfo.total === 'number' ? bouncedInfo.total : 0,
        soft_bounce_count: typeof bouncedInfo.soft === 'number' ? bouncedInfo.soft : 0,
        hard_bounce_count: typeof bouncedInfo.hard === 'number' ? bouncedInfo.hard : 0,
        unsubscribe_count: typeof deliveryInfo.unsubscribed === 'number' ? deliveryInfo.unsubscribed : 0,
        abuse_complaint_count: typeof deliveryInfo.complained === 'number' ? deliveryInfo.complained : 0
      };
      
      return {
        statistics: extractedStats,
        delivery_info: deliveryInfo
      };
    }
    
    // En dernier recours, retourner des statistiques vides
    console.log(`Aucune statistique disponible pour ${campaignUid}, utilisation de valeurs par défaut`);
    return {
      statistics: emptyStats,
      delivery_info: emptyDeliveryInfo
    };
    
  } catch (error) {
    console.error("Erreur lors du traitement des statistiques de campagne:", error);
    return { 
      statistics: emptyStats,
      delivery_info: emptyDeliveryInfo
    };
  }
};
