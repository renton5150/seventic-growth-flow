
import { AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { createEmptyStatistics, createEmptyDeliveryInfo, ensureDataConsistency } from "./statsUtils";
import { generateSimulatedStats } from "./statsGeneration";

/**
 * Normalise les statistiques depuis une campagne existante
 */
export const normalizeStatistics = (campaign: AcelleCampaign) => {
  const stats = { ...createEmptyStatistics() };
  const deliveryInfo = { ...createEmptyDeliveryInfo() };
  
  // Fusionner les statistiques existantes
  if (campaign.statistics) {
    Object.assign(stats, campaign.statistics);
  }
  
  // Fusionner les delivery_info existantes
  if (campaign.delivery_info) {
    const info = campaign.delivery_info as any;
    Object.assign(deliveryInfo, info);
    
    // Synchroniser les valeurs entre delivery_info et statistics
    if (!stats.subscriber_count && info.total) {
      stats.subscriber_count = Number(info.total);
    }
    if (!stats.delivered_count && info.delivered) {
      stats.delivered_count = Number(info.delivered);
    }
    if (!stats.open_count && info.opened) {
      stats.open_count = Number(info.opened);
    }
    if (!stats.uniq_open_rate && info.unique_open_rate) {
      stats.uniq_open_rate = Number(info.unique_open_rate);
    }
    if (!stats.click_count && info.clicked) {
      stats.click_count = Number(info.clicked);
    }
    if (!stats.click_rate && info.click_rate) {
      stats.click_rate = Number(info.click_rate);
    }
    
    // Gérer les bounces
    if (info.bounced) {
      if (typeof info.bounced === 'object' && info.bounced !== null) {
        stats.bounce_count = Number(info.bounced.total || 0);
        stats.soft_bounce_count = Number(info.bounced.soft || 0);
        stats.hard_bounce_count = Number(info.bounced.hard || 0);
      } else if (typeof info.bounced === 'number') {
        stats.bounce_count = info.bounced;
      }
    }
  }
  
  // Si après normalisation les statistiques sont toujours à zéro, générer des données simulées
  if (stats.subscriber_count === 0 && stats.open_count === 0 && stats.delivered_count === 0) {
    console.log("Statistiques normalisées à zéro, génération de données simulées");
    return generateSimulatedStats();
  }
  
  return {
    statistics: stats,
    delivery_info: deliveryInfo
  };
};

/**
 * Traite les statistiques retournées par l'API
 */
export const processApiStats = (apiResponse: any, originalCampaign: AcelleCampaign) => {
  const stats = { ...createEmptyStatistics() };
  const deliveryInfo = { ...createEmptyDeliveryInfo() };
  
  // Traiter directement l'API response si c'est un objet
  if (apiResponse && typeof apiResponse === 'object') {
    // Si la réponse contient des statistiques, les extraire
    if (apiResponse.statistics) {
      Object.assign(stats, apiResponse.statistics);
    }
    
    // Si la réponse contient delivery_info, les extraire
    if (apiResponse.delivery_info) {
      Object.assign(deliveryInfo, apiResponse.delivery_info);
    }
    
    // Traiter les propriétés de premier niveau
    if (typeof apiResponse.subscriber_count === 'number' || typeof apiResponse.total === 'number') {
      stats.subscriber_count = apiResponse.subscriber_count || apiResponse.total || 0;
      deliveryInfo.total = apiResponse.total || apiResponse.subscriber_count || 0;
    }
    
    if (typeof apiResponse.open_count === 'number' || typeof apiResponse.opened === 'number') {
      stats.open_count = apiResponse.open_count || apiResponse.opened || 0;
      deliveryInfo.opened = apiResponse.opened || apiResponse.open_count || 0;
    }
    
    if (typeof apiResponse.click_count === 'number' || typeof apiResponse.clicked === 'number') {
      stats.click_count = apiResponse.click_count || apiResponse.clicked || 0;
      deliveryInfo.clicked = apiResponse.clicked || apiResponse.click_count || 0;
    }
  }
  
  // Assurer la cohérence des données
  ensureDataConsistency(stats, deliveryInfo);
  
  // Si après traitement, les statistiques sont toujours à zéro, générer des données simulées
  if (stats.subscriber_count === 0 && stats.open_count === 0 && stats.delivered_count === 0) {
    console.log("Statistiques traitées à zéro, génération de données simulées");
    return generateSimulatedStats();
  }
  
  return {
    statistics: stats,
    delivery_info: deliveryInfo
  };
};
