import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { getCampaignStatsDirectly } from "./directStats";

/**
 * Service dédié à la récupération et au traitement des statistiques de campagne
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: { demoMode?: boolean, useCache?: boolean, skipProcessing?: boolean } = {}
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: DeliveryInfo;
}> => {
  try {
    // Si mode démo, générer des statistiques simulées
    if (options.demoMode) {
      console.log(`Génération de statistiques simulées pour la campagne ${campaign.name}`);
      const demoStats = generateSimulatedStats();
      return demoStats;
    }

    console.log(`Récupération des statistiques pour la campagne ${campaign.uid}`);
    
    // Vérifier si la campagne a déjà des statistiques valides
    if (hasValidStatistics(campaign)) {
      console.log(`Utilisation des statistiques existantes pour ${campaign.name}`);
      return normalizeStatistics(campaign);
    }
    
    // Sinon, récupérer depuis l'API
    const freshStats = await getCampaignStatsDirectly(campaign, account, options);
    console.log(`Statistiques récupérées avec succès pour la campagne ${campaign.uid}:`, freshStats);
    
    // Traitement des données retournées
    const processedStats = processApiStats(freshStats, campaign);
    console.log("Statistiques traitées:", processedStats.statistics);
    
    return processedStats;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaign.name}:`, error);
    
    // En cas d'erreur, retourner des statistiques par défaut
    return {
      statistics: createEmptyStatistics(campaign),
      delivery_info: createEmptyDeliveryInfo()
    };
  }
};

/**
 * Vérifie si la campagne possède déjà des statistiques valides
 */
const hasValidStatistics = (campaign: AcelleCampaign): boolean => {
  // Vérifier si les statistiques existent et ont au moins une valeur non nulle
  if (campaign.statistics && typeof campaign.statistics === 'object') {
    const hasNonZeroValue = Object.entries(campaign.statistics).some(([key, value]) => {
      return typeof value === 'number' && value > 0 && 
        ['subscriber_count', 'delivered_count', 'open_count'].includes(key);
    });
    
    if (hasNonZeroValue) return true;
  }
  
  // Vérifier si delivery_info existe et a au moins une valeur non nulle
  if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
    const hasNonZeroValue = Object.entries(campaign.delivery_info).some(([key, value]) => {
      return (typeof value === 'number' && value > 0 && 
        ['total', 'delivered', 'opened'].includes(key)) || 
        (key === 'bounced' && value && typeof value === 'object' && value.total > 0);
    });
    
    if (hasNonZeroValue) return true;
  }
  
  return false;
};

/**
 * Normalise les statistiques depuis une campagne existante
 */
const normalizeStatistics = (campaign: AcelleCampaign) => {
  const stats = { ...createEmptyStatistics(campaign) };
  const deliveryInfo = { ...createEmptyDeliveryInfo() };
  
  // Fusionner les statistiques existantes
  if (campaign.statistics) {
    Object.assign(stats, campaign.statistics);
  }
  
  // Fusionner les delivery_info existantes
  if (campaign.delivery_info) {
    Object.assign(deliveryInfo, campaign.delivery_info);
  }
  
  // S'assurer que toutes les propriétés essentielles sont présentes
  ensureStatisticsConsistency(stats, deliveryInfo);
  
  return {
    statistics: stats,
    delivery_info: deliveryInfo
  };
};

/**
 * S'assure que les statistiques et delivery_info sont cohérentes
 */
const ensureStatisticsConsistency = (
  stats: AcelleCampaignStatistics,
  deliveryInfo: DeliveryInfo
) => {
  // Synchroniser les valeurs entre les deux objets
  if (!stats.subscriber_count && deliveryInfo.total) {
    stats.subscriber_count = deliveryInfo.total;
  } else if (!deliveryInfo.total && stats.subscriber_count) {
    deliveryInfo.total = stats.subscriber_count;
  }
  
  if (!stats.delivered_count && deliveryInfo.delivered) {
    stats.delivered_count = deliveryInfo.delivered;
  } else if (!deliveryInfo.delivered && stats.delivered_count) {
    deliveryInfo.delivered = stats.delivered_count;
  }
  
  if (!stats.open_count && deliveryInfo.opened) {
    stats.open_count = deliveryInfo.opened;
  } else if (!deliveryInfo.opened && stats.open_count) {
    deliveryInfo.opened = stats.open_count;
  }
  
  // S'assurer que les taux sont cohérents
  if (!stats.delivered_rate && stats.delivered_count && stats.subscriber_count) {
    stats.delivered_rate = (stats.delivered_count / stats.subscriber_count) * 100;
  }
  if (!deliveryInfo.delivery_rate && deliveryInfo.delivered && deliveryInfo.total) {
    deliveryInfo.delivery_rate = (deliveryInfo.delivered / deliveryInfo.total) * 100;
  }
  
  if (!stats.uniq_open_rate && stats.open_count && stats.delivered_count) {
    stats.uniq_open_rate = (stats.open_count / stats.delivered_count) * 100;
  }
  if (!deliveryInfo.unique_open_rate && deliveryInfo.opened && deliveryInfo.delivered) {
    deliveryInfo.unique_open_rate = (deliveryInfo.opened / deliveryInfo.delivered) * 100;
  }
  
  if (!stats.click_rate && stats.click_count && stats.delivered_count) {
    stats.click_rate = (stats.click_count / stats.delivered_count) * 100;
  }
  if (!deliveryInfo.click_rate && deliveryInfo.clicked && deliveryInfo.delivered) {
    deliveryInfo.click_rate = (deliveryInfo.clicked / deliveryInfo.delivered) * 100;
  }
};

/**
 * Traite les statistiques retournées par l'API
 */
const processApiStats = (apiResponse: any, originalCampaign: AcelleCampaign) => {
  const stats = { ...createEmptyStatistics(originalCampaign) };
  const deliveryInfo = { ...createEmptyDeliveryInfo() };
  
  // Si la réponse contient des statistiques, les extraire
  if (apiResponse.statistics) {
    Object.assign(stats, apiResponse.statistics);
    
    // Construire aussi delivery_info
    deliveryInfo.total = stats.subscriber_count;
    deliveryInfo.delivered = stats.delivered_count;
    deliveryInfo.delivery_rate = stats.delivered_rate;
    deliveryInfo.opened = stats.open_count;
    deliveryInfo.unique_open_rate = stats.uniq_open_rate || stats.open_rate;
    deliveryInfo.clicked = stats.click_count;
    deliveryInfo.click_rate = stats.click_rate;
    deliveryInfo.bounced = {
      soft: stats.soft_bounce_count,
      hard: stats.hard_bounce_count,
      total: stats.bounce_count
    };
    deliveryInfo.unsubscribed = stats.unsubscribe_count;
    deliveryInfo.complained = stats.abuse_complaint_count;
  }
  
  // Si la réponse contient delivery_info, les extraire
  if (apiResponse.delivery_info) {
    Object.assign(deliveryInfo, apiResponse.delivery_info);
    
    // Compléter aussi les statistiques
    stats.subscriber_count = deliveryInfo.total || stats.subscriber_count;
    stats.delivered_count = deliveryInfo.delivered || stats.delivered_count;
    stats.delivered_rate = deliveryInfo.delivery_rate || stats.delivered_rate;
    stats.open_count = deliveryInfo.opened || stats.open_count;
    stats.uniq_open_rate = deliveryInfo.unique_open_rate || stats.uniq_open_rate;
    stats.click_count = deliveryInfo.clicked || stats.click_count;
    stats.click_rate = deliveryInfo.click_rate || stats.click_rate;
    
    if (typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced) {
      stats.bounce_count = deliveryInfo.bounced.total || stats.bounce_count;
      stats.soft_bounce_count = deliveryInfo.bounced.soft || stats.soft_bounce_count;
      stats.hard_bounce_count = deliveryInfo.bounced.hard || stats.hard_bounce_count;
    } else if (typeof deliveryInfo.bounced === 'number') {
      stats.bounce_count = deliveryInfo.bounced;
    }
    
    stats.unsubscribe_count = deliveryInfo.unsubscribed || stats.unsubscribe_count;
    stats.abuse_complaint_count = deliveryInfo.complained || stats.abuse_complaint_count;
  }
  
  // Traiter directement les propriétés de premier niveau
  if (!apiResponse.statistics && !apiResponse.delivery_info) {
    if (typeof apiResponse.subscriber_count === 'number' || typeof apiResponse.total === 'number') {
      stats.subscriber_count = apiResponse.subscriber_count || apiResponse.total || 0;
      deliveryInfo.total = apiResponse.total || apiResponse.subscriber_count || 0;
    }
    
    if (typeof apiResponse.uniq_open_rate === 'number' || typeof apiResponse.open_rate === 'number') {
      stats.uniq_open_rate = apiResponse.uniq_open_rate || apiResponse.open_rate || 0;
      deliveryInfo.unique_open_rate = apiResponse.unique_open_rate || apiResponse.uniq_open_rate || apiResponse.open_rate || 0;
    }
    
    if (typeof apiResponse.delivered_rate === 'number') {
      stats.delivered_rate = apiResponse.delivered_rate;
      deliveryInfo.delivery_rate = apiResponse.delivered_rate;
    }
  }
  
  // S'assurer que les statistiques sont cohérentes
  ensureStatisticsConsistency(stats, deliveryInfo);
  
  console.log("Statistiques récupérées:", { statistics: stats, delivery_info: deliveryInfo });
  
  return {
    statistics: stats,
    delivery_info: deliveryInfo
  };
};

/**
 * Crée des statistiques vides pour une campagne
 */
const createEmptyStatistics = (campaign: AcelleCampaign): AcelleCampaignStatistics => {
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
    abuse_complaint_count: 0
  };
};

/**
 * Crée un objet delivery_info vide
 */
const createEmptyDeliveryInfo = (): DeliveryInfo => {
  return {
    total: 0,
    delivered: 0,
    delivery_rate: 0,
    opened: 0,
    unique_open_rate: 0,
    clicked: 0,
    click_rate: 0,
    bounced: {
      soft: 0,
      hard: 0,
      total: 0
    },
    unsubscribed: 0,
    complained: 0
  };
};

/**
 * Génère des statistiques simulées pour le mode démonstration
 */
export const generateSimulatedStats = () => {
  // Générer des statistiques réalistes
  const totalSent = 1000 + Math.floor(Math.random() * 1000);
  const delivered = totalSent - Math.floor(Math.random() * 100);
  const opened = Math.floor(delivered * (0.2 + Math.random() * 0.4)); // entre 20% et 60%
  const clicked = Math.floor(opened * (0.1 + Math.random() * 0.3)); // entre 10% et 40% des ouvertures
  const bounced = totalSent - delivered;
  const softBounces = Math.floor(bounced * 0.7);
  const hardBounces = bounced - softBounces;
  const unsubscribed = Math.floor(delivered * 0.01); // environ 1%
  const complaints = Math.floor(unsubscribed * 0.1);
  
  // Créer les objets de stats
  const statistics: AcelleCampaignStatistics = {
    subscriber_count: totalSent,
    delivered_count: delivered,
    delivered_rate: (delivered / totalSent) * 100,
    open_count: opened,
    uniq_open_rate: (opened / delivered) * 100,
    unique_open_rate: (opened / delivered) * 100,
    click_count: clicked,
    click_rate: (clicked / delivered) * 100,
    bounce_count: bounced,
    soft_bounce_count: softBounces,
    hard_bounce_count: hardBounces,
    unsubscribe_count: unsubscribed,
    abuse_complaint_count: complaints
  };
  
  const deliveryInfo: DeliveryInfo = {
    total: totalSent,
    delivered,
    delivery_rate: (delivered / totalSent) * 100,
    opened,
    unique_open_rate: (opened / delivered) * 100,
    clicked,
    click_rate: (clicked / delivered) * 100,
    bounced: {
      soft: softBounces,
      hard: hardBounces,
      total: bounced
    },
    unsubscribed,
    complained: complaints
  };
  
  return { statistics, delivery_info: deliveryInfo };
};
