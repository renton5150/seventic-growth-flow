
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Interface pour les options de récupération de statistiques
 */
interface StatsOptions {
  useDirectApi?: boolean;
  useFallback?: boolean;
  demoMode?: boolean;
}

/**
 * Récupère les statistiques d'une campagne Acelle directement depuis l'API
 * 
 * @param campaign La campagne pour laquelle récupérer les statistiques
 * @param account Le compte Acelle contenant les informations de connexion
 * @param options Options de récupération
 * @returns Statistiques de la campagne
 */
export async function getCampaignStatsDirectly(
  campaign: AcelleCampaign, 
  account: AcelleAccount,
  options: StatsOptions = {}
): Promise<Record<string, any>> {
  const { useDirectApi = true, useFallback = true, demoMode = false } = options;
  
  // Si mode démo activé, retourner des statistiques simulées
  if (demoMode) {
    console.log("Mode démo: génération de statistiques simulées");
    return generateSimulatedStats();
  }
  
  try {
    // Vérifier si le compte et la campagne sont valides
    const campaignId = campaign?.uid || campaign?.campaign_uid;
    if (!campaignId || !account?.apiEndpoint || !account?.apiToken) {
      console.warn("Informations de compte ou de campagne incomplètes", { 
        hasUid: !!campaignId, 
        hasEndpoint: !!account?.apiEndpoint,
        hasApiKey: !!account?.apiToken
      });
      
      // Mode dégradé: utiliser les stats existantes
      if (campaign.statistics && Object.keys(campaign.statistics).length > 0) {
        console.log("Utilisation des statistiques existantes dans campaign.statistics");
        return { statistics: campaign.statistics };
      }
      
      if (campaign.delivery_info && Object.keys(campaign.delivery_info).length > 0) {
        console.log("Utilisation des statistiques existantes dans campaign.delivery_info");
        return { delivery_info: campaign.delivery_info };
      }
      
      return {};
    }
    
    if (useDirectApi) {
      // Appel direct à l'API Acelle
      console.log(`Récupération directe des stats pour la campagne ${campaignId}`);
      const apiToken = account.apiToken;
      
      const rawStats = await fetchCampaignStats(
        campaignId,
        account.apiEndpoint,
        apiToken
      );
      
      if (rawStats) {
        console.log(`Statistiques récupérées avec succès pour la campagne ${campaignId}:`, rawStats);
        
        // Extraire et traiter les statistiques directement depuis la réponse API
        let statisticsData = {};
        
        if (rawStats.statistics) {
          // Si l'API renvoie déjà un objet statistics formaté
          statisticsData = rawStats.statistics;
        } else {
          // Sinon, traiter les données brutes
          statisticsData = processRawStats(rawStats);
        }
        
        console.log("Statistiques traitées:", statisticsData);
        
        // Créer un résultat correctement structuré
        const result = {
          statistics: statisticsData,
          delivery_info: formatToDeliveryInfo(statisticsData)
        };
        
        return result;
      }
    }
    
    // Si l'appel direct échoue et que le mode de repli est activé
    if (useFallback) {
      console.log("Utilisation des stats existantes dans les données de campagne");
      
      // Vérifier d'abord statistics puis delivery_info
      if (campaign.statistics && Object.keys(campaign.statistics).length > 0) {
        return { statistics: campaign.statistics, delivery_info: formatToDeliveryInfo(campaign.statistics) };
      }
      
      if (campaign.delivery_info && Object.keys(campaign.delivery_info).length > 0) {
        return { delivery_info: campaign.delivery_info, statistics: formatToStatistics(campaign.delivery_info) };
      }
    }
    
    return {};
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    
    // En cas d'erreur et si le mode de repli est activé
    if (useFallback) {
      if (campaign.statistics && Object.keys(campaign.statistics).length > 0) {
        return { statistics: campaign.statistics, delivery_info: formatToDeliveryInfo(campaign.statistics) };
      }
      
      if (campaign.delivery_info && Object.keys(campaign.delivery_info).length > 0) {
        return { delivery_info: campaign.delivery_info, statistics: formatToStatistics(campaign.delivery_info) };
      }
    }
    
    return {};
  }
}

/**
 * Convertit l'objet statistics au format delivery_info
 */
function formatToDeliveryInfo(stats: any): Record<string, any> {
  if (!stats) return {};
  
  // Mappages entre les noms de propriétés
  const bounced = typeof stats.bounce_count === 'number' 
    ? {
        total: stats.bounce_count || 0,
        soft: stats.soft_bounce_count || 0,
        hard: stats.hard_bounce_count || 0
      }
    : stats.bounce_count || 0;
    
  return {
    total: stats.subscriber_count || stats.total || 0,
    delivered: stats.delivered_count || stats.delivered || 0,
    delivery_rate: stats.delivered_rate || 0,
    opened: stats.open_count || stats.opened || 0,
    unique_open_rate: stats.uniq_open_rate || stats.open_rate || stats.unique_open_rate || 0,
    clicked: stats.click_count || stats.clicked || 0,
    click_rate: stats.click_rate || 0,
    bounced: bounced,
    unsubscribed: stats.unsubscribe_count || stats.unsubscribed || 0,
    complained: stats.abuse_complaint_count || stats.complaint_count || stats.complained || 0
  };
}

/**
 * Convertit l'objet delivery_info au format statistics
 */
function formatToStatistics(info: any): Record<string, any> {
  if (!info) return {};
  
  // Extraire les valeurs de bounces, qu'elles soient un objet ou un nombre
  let bounce_count = 0;
  let soft_bounce_count = 0;
  let hard_bounce_count = 0;
  
  if (info.bounced) {
    if (typeof info.bounced === 'object') {
      bounce_count = info.bounced.total || 0;
      soft_bounce_count = info.bounced.soft || 0;
      hard_bounce_count = info.bounced.hard || 0;
    } else if (typeof info.bounced === 'number') {
      bounce_count = info.bounced;
    }
  }
  
  return {
    subscriber_count: info.total || 0,
    delivered_count: info.delivered || 0,
    delivered_rate: info.delivery_rate || 0,
    open_count: info.opened || 0,
    uniq_open_rate: info.unique_open_rate || 0,
    click_count: info.clicked || 0,
    click_rate: info.click_rate || 0,
    bounce_count: bounce_count,
    soft_bounce_count: soft_bounce_count,
    hard_bounce_count: hard_bounce_count,
    unsubscribe_count: info.unsubscribed || 0,
    abuse_complaint_count: info.complained || 0
  };
}

/**
 * Met à jour en masse les statistiques pour un ensemble de campagnes
 * 
 * @param campaigns Liste des campagnes
 * @param account Compte Acelle
 * @param options Options de mise à jour
 * @returns Campagnes mises à jour avec leurs statistiques
 */
export async function enrichCampaignsWithStats(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options: StatsOptions = {}
): Promise<AcelleCampaign[]> {
  if (!campaigns || campaigns.length === 0 || !account) {
    return campaigns;
  }
  
  // Limiter à 5 campagnes pour éviter trop d'appels API
  const campaignsToEnrich = campaigns.slice(0, 5);
  
  console.log(`Enrichissement de ${campaignsToEnrich.length} campagnes avec statistiques`);
  
  const enrichedCampaigns = await Promise.all(
    campaignsToEnrich.map(async (campaign) => {
      try {
        const statsResult = await getCampaignStatsDirectly(campaign, account, options);
        
        // Extraire les valeurs statistiques des résultats
        const stats = statsResult.statistics || statsResult.delivery_info || statsResult;
        
        // S'assurer que le typage est correct pour les statistiques
        const typedStats: Partial<AcelleCampaignStatistics> = {
          subscriber_count: stats.subscriber_count || stats.total || 0,
          delivered_count: stats.delivered_count || stats.delivered || 0,
          delivered_rate: stats.delivered_rate || stats.delivery_rate || 0,
          open_count: stats.open_count || stats.opened || 0,
          uniq_open_rate: stats.uniq_open_rate || stats.open_rate || stats.unique_open_rate || 0,
          click_count: stats.click_count || stats.clicked || 0,
          click_rate: stats.click_rate || 0,
          bounce_count: stats.bounce_count || 
            (stats.bounced ? (typeof stats.bounced === 'object' ? stats.bounced.total : stats.bounced) : 0),
          soft_bounce_count: stats.soft_bounce_count || 
            (stats.bounced && typeof stats.bounced === 'object' ? stats.bounced.soft : 0),
          hard_bounce_count: stats.hard_bounce_count || 
            (stats.bounced && typeof stats.bounced === 'object' ? stats.bounced.hard : 0),
          unsubscribe_count: stats.unsubscribe_count || stats.unsubscribed || 0,
          abuse_complaint_count: stats.complaint_count || stats.complained || stats.abuse_complaint_count || 0
        };
        
        // Construire l'objet delivery_info compatible
        const deliveryInfo = {
          total: typedStats.subscriber_count || 0,
          delivered: typedStats.delivered_count || 0,
          delivery_rate: typedStats.delivered_rate || 0,
          opened: typedStats.open_count || 0,
          unique_open_rate: typedStats.uniq_open_rate || 0,
          clicked: typedStats.click_count || 0,
          click_rate: typedStats.click_rate || 0,
          bounced: {
            total: typedStats.bounce_count || 0,
            soft: typedStats.soft_bounce_count || 0,
            hard: typedStats.hard_bounce_count || 0
          },
          unsubscribed: typedStats.unsubscribe_count || 0,
          complained: typedStats.abuse_complaint_count || 0
        };
        
        // Créer un objet campagne correctement typé
        const enrichedCampaign: AcelleCampaign = {
          ...campaign,
          delivery_info: deliveryInfo,
          statistics: typedStats as AcelleCampaignStatistics
        };
        
        return enrichedCampaign;
      } catch (error) {
        console.error(`Erreur lors de l'enrichissement de la campagne ${campaign.name}:`, error);
        return campaign;
      }
    })
  );
  
  return enrichedCampaigns;
}

// Réutiliser les fonctions existantes du module campaignStatusUtils pour la continuité
import { fetchCampaignStats, processRawStats, generateSimulatedStats } from "@/utils/acelle/campaignStatusUtils";
