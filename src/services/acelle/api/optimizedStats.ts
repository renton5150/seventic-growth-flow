
import { AcelleCampaign, AcelleCampaignStatistics } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';

// Cache en mémoire pour les statistiques des campagnes
const statsCache = new Map<string, AcelleCampaignStatistics>();

/**
 * Extrait les statistiques rapides d'une campagne pour l'affichage
 * en utilisant prioritairement les données déjà disponibles
 */
export function extractQuickStats(campaign: AcelleCampaign): AcelleCampaignStatistics {
  // Si la campagne a déjà des statistiques complètes, les utiliser
  if (campaign.statistics) {
    console.log(`Utilisation des statistiques existantes pour ${campaign.name}`);
    return campaign.statistics;
  }
  
  // Si la statistique est déjà en cache, l'utiliser
  const campaignUid = campaign.uid || campaign.campaign_uid;
  if (campaignUid && statsCache.has(campaignUid)) {
    console.log(`Utilisation des statistiques en cache pour ${campaign.name}`);
    return statsCache.get(campaignUid)!;
  }
  
  // Sinon, extraire les statistiques depuis delivery_info
  console.log(`Extraction des statistiques depuis delivery_info pour ${campaign.name}`);
  
  if (!campaign.delivery_info) {
    console.warn(`Aucune donnée delivery_info pour la campagne ${campaign.name}`);
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
  }
  
  // Cast delivery_info à un type sûr pour l'extraction
  const deliveryInfo = campaign.delivery_info as Record<string, any>;
  
  // Extraire les données de delivery_info avec une gestion complète des cas
  const stats: AcelleCampaignStatistics = {
    subscriber_count: Number(deliveryInfo.total) || 0,
    delivered_count: Number(deliveryInfo.delivered) || 0,
    delivered_rate: Number(deliveryInfo.delivery_rate) || 0,
    open_count: Number(deliveryInfo.opened) || 0,
    uniq_open_rate: Number(deliveryInfo.unique_open_rate) || 0,
    click_count: Number(deliveryInfo.clicked) || 0,
    click_rate: Number(deliveryInfo.click_rate) || 0,
    bounce_count: getBounceCount(deliveryInfo),
    soft_bounce_count: getSoftBounceCount(deliveryInfo),
    hard_bounce_count: getHardBounceCount(deliveryInfo),
    unsubscribe_count: Number(deliveryInfo.unsubscribed) || 0,
    abuse_complaint_count: Number(deliveryInfo.complained) || 0
  };
  
  // Ajouter au cache
  if (campaignUid) {
    statsCache.set(campaignUid, stats);
  }
  
  return stats;
}

/**
 * Extrait le nombre total de rebonds
 */
function getBounceCount(deliveryInfo: Record<string, any>): number {
  if (!deliveryInfo) return 0;
  
  // Si bounced est un objet avec une propriété total
  if (deliveryInfo.bounced && typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced.total) {
    return Number(deliveryInfo.bounced.total);
  }
  
  // Si bounced est directement un nombre
  if (typeof deliveryInfo.bounced === 'number') {
    return deliveryInfo.bounced;
  }
  
  // Si bounce_count est disponible
  if (deliveryInfo.bounce_count) {
    return Number(deliveryInfo.bounce_count);
  }
  
  return 0;
}

/**
 * Extrait le nombre de soft bounces
 */
function getSoftBounceCount(deliveryInfo: Record<string, any>): number {
  if (!deliveryInfo) return 0;
  
  // Si bounced est un objet avec une propriété soft
  if (deliveryInfo.bounced && typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced.soft) {
    return Number(deliveryInfo.bounced.soft);
  }
  
  // Si soft_bounce_count est disponible
  if (deliveryInfo.soft_bounce_count) {
    return Number(deliveryInfo.soft_bounce_count);
  }
  
  return 0;
}

/**
 * Extrait le nombre de hard bounces
 */
function getHardBounceCount(deliveryInfo: Record<string, any>): number {
  if (!deliveryInfo) return 0;
  
  // Si bounced est un objet avec une propriété hard
  if (deliveryInfo.bounced && typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced.hard) {
    return Number(deliveryInfo.bounced.hard);
  }
  
  // Si hard_bounce_count est disponible
  if (deliveryInfo.hard_bounce_count) {
    return Number(deliveryInfo.hard_bounce_count);
  }
  
  return 0;
}

/**
 * Mettre à jour le cache des statistiques pour une campagne
 */
export function cacheStats(campaignUid: string, stats: AcelleCampaignStatistics): void {
  if (!campaignUid) return;
  
  statsCache.set(campaignUid, stats);
  console.log(`Statistiques mises en cache pour la campagne ${campaignUid}`);
}

/**
 * Récupérer les statistiques en cache pour une campagne
 */
export function getCachedStats(campaignUid: string): AcelleCampaignStatistics | undefined {
  if (!campaignUid) return undefined;
  return statsCache.get(campaignUid);
}

/**
 * Rafraîchir les statistiques en cache pour une liste de campagnes
 */
export async function refreshStatsCacheForCampaigns(
  campaignUids: string[]
): Promise<Map<string, AcelleCampaignStatistics>> {
  console.log(`Rafraîchissement des statistiques pour ${campaignUids.length} campagnes`);
  
  if (campaignUids.length === 0) return statsCache;
  
  try {
    // Récupérer les campagnes depuis la base de données
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('campaign_uid', campaignUids);
      
    if (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return statsCache;
    }
    
    // Mettre à jour le cache avec les nouvelles données
    for (const campaign of data || []) {
      if (campaign.campaign_uid && campaign.delivery_info) {
        const uid = campaign.campaign_uid;
        // Traiter explicitement delivery_info comme un objet
        const deliveryInfo = typeof campaign.delivery_info === 'string' 
          ? JSON.parse(campaign.delivery_info) 
          : campaign.delivery_info as Record<string, any>;
        
        // Construire les statistiques à partir de delivery_info
        const stats: AcelleCampaignStatistics = {
          subscriber_count: Number(deliveryInfo.total) || 0,
          delivered_count: Number(deliveryInfo.delivered) || 0,
          delivered_rate: Number(deliveryInfo.delivery_rate) || 0,
          open_count: Number(deliveryInfo.opened) || 0,
          uniq_open_rate: Number(deliveryInfo.unique_open_rate) || 0,
          click_count: Number(deliveryInfo.clicked) || 0,
          click_rate: Number(deliveryInfo.click_rate) || 0,
          bounce_count: getBounceCount(deliveryInfo),
          soft_bounce_count: getSoftBounceCount(deliveryInfo),
          hard_bounce_count: getHardBounceCount(deliveryInfo),
          unsubscribe_count: Number(deliveryInfo.unsubscribed) || 0,
          abuse_complaint_count: Number(deliveryInfo.complained) || 0
        };
        
        // Mettre en cache avec des vérifications pour éviter des valeurs nulles
        if (stats.subscriber_count > 0 || stats.delivered_count > 0 || stats.open_count > 0) {
          statsCache.set(uid, stats);
          console.log(`Statistiques mises en cache pour ${uid}`);
        }
      }
    }
    
    return statsCache;
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du cache:", error);
    return statsCache;
  }
}
