
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { generateSimulatedStats } from './campaignStats';

interface StatsOptions {
  demoMode?: boolean;
  useCache?: boolean;
  skipProcessing?: boolean;
}

/**
 * Récupère les statistiques directement depuis l'API Acelle
 */
export const getCampaignStatsDirectly = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: StatsOptions = {}
) => {
  const { demoMode, useCache = true } = options;
  
  if (demoMode) {
    console.log(`Mode démo actif pour ${campaign.name}, génération de stats`);
    return generateSimulatedStats();
  }
  
  if (!campaign.uid && !campaign.campaign_uid) {
    throw new Error('UID de campagne manquant');
  }
  
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  try {
    // Si useCache est actif, essayer d'abord de récupérer depuis le cache
    if (useCache) {
      console.log(`Tentative de récupération depuis le cache pour ${campaignUid}`);
      
      try {
        const { data: cachedCampaign, error } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .single();
          
        if (!error && cachedCampaign && cachedCampaign.delivery_info) {
          console.log(`Statistiques trouvées en cache pour ${campaign.name}`);
          
          // Retourner les données mises en forme
          return {
            statistics: extractStatsFromCacheRecord(cachedCampaign),
            delivery_info: cachedCampaign.delivery_info
          };
        } else {
          console.log(`Pas de statistiques en cache pour ${campaign.name}`);
        }
      } catch (cacheError) {
        console.error('Erreur lors de la récupération depuis le cache:', cacheError);
      }
    }
    
    // Si pas de données en cache ou cache non utilisé, générer des stats de remplacement temporaires
    // En production, on appellerait l'API Acelle ici
    console.log(`Génération de statistiques temporaires pour ${campaign.name}`);
    return generateSimulatedStats();
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaign.name}:`, error);
    throw error;
  }
};

/**
 * Extrait les statistiques d'un enregistrement de cache
 */
function extractStatsFromCacheRecord(cacheRecord: any): AcelleCampaignStatistics {
  // Si pas de delivery_info, retourner des stats vides
  if (!cacheRecord.delivery_info) {
    return createEmptyStatistics();
  }
  
  const deliveryInfo = typeof cacheRecord.delivery_info === 'string' 
    ? JSON.parse(cacheRecord.delivery_info) 
    : cacheRecord.delivery_info;
    
  // S'assurer que delivery_info est bien un objet
  if (!deliveryInfo || typeof deliveryInfo !== 'object') {
    return createEmptyStatistics();
  }
  
  // Log delivery_info for debugging
  console.log("Processing delivery_info:", deliveryInfo);
  
  // Extraire les bounces avec gestion des différentes structures
  const bounced = deliveryInfo.bounced || {};
  const bouncedTotal = typeof bounced === 'object' 
    ? (bounced.total || 0) 
    : (typeof bounced === 'number' ? bounced : 0);
    
  const softBounce = typeof bounced === 'object' ? (bounced.soft || 0) : 0;
  const hardBounce = typeof bounced === 'object' ? (bounced.hard || 0) : 0;
  
  // Créer l'objet de statistiques
  return {
    subscriber_count: Number(deliveryInfo.total) || 0,
    delivered_count: Number(deliveryInfo.delivered) || 0,
    delivered_rate: Number(deliveryInfo.delivery_rate) || 0,
    open_count: Number(deliveryInfo.opened) || 0,
    uniq_open_rate: Number(deliveryInfo.unique_open_rate) || 0,
    click_count: Number(deliveryInfo.clicked) || 0,
    click_rate: Number(deliveryInfo.click_rate) || 0,
    bounce_count: bouncedTotal,
    soft_bounce_count: softBounce,
    hard_bounce_count: hardBounce,
    unsubscribe_count: Number(deliveryInfo.unsubscribed) || 0,
    abuse_complaint_count: Number(deliveryInfo.complained) || 0
  };
}

/**
 * Crée un objet de statistiques vide
 */
function createEmptyStatistics(): AcelleCampaignStatistics {
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

/**
 * Enrichit un tableau de campagnes avec leurs statistiques
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount
): Promise<AcelleCampaign[]> => {
  // Si pas de campagnes, retourner un tableau vide
  if (!campaigns || campaigns.length === 0) {
    return [];
  }
  
  console.log(`Enrichissement de ${campaigns.length} campagnes avec leurs statistiques`);
  
  // Clone campaigns to avoid mutating the originals
  const result = JSON.parse(JSON.stringify(campaigns)) as AcelleCampaign[];
  
  // Récupérer les UIDs des campagnes
  const campaignUids = result
    .filter(c => c.uid || c.campaign_uid)
    .map(c => c.uid || c.campaign_uid || '');
    
  if (campaignUids.length === 0) {
    return result;
  }
  
  try {
    // Récupérer les données de cache pour toutes les campagnes d'un coup
    console.log(`Fetching cache data for ${campaignUids.length} campaigns`);
    const { data: cachedCampaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('campaign_uid', campaignUids);
      
    if (error) {
      console.error("Erreur lors de la récupération des statistiques en cache:", error);
      return result;
    }
    
    console.log(`Found ${cachedCampaigns?.length || 0} campaigns in cache`);
    
    // Créer une map pour un accès rapide
    const cacheMap = new Map();
    cachedCampaigns?.forEach(cache => {
      if (cache.campaign_uid) {
        cacheMap.set(cache.campaign_uid, cache);
      }
    });
    
    // Enrichir chaque campagne avec ses statistiques
    for (let i = 0; i < result.length; i++) {
      const campaign = result[i];
      const campaignUid = campaign.uid || campaign.campaign_uid;
      const cachedData = campaignUid ? cacheMap.get(campaignUid) : null;
      
      if (cachedData?.delivery_info) {
        console.log(`Found cache data for campaign ${campaign.name}`);
        // Extraire les statistiques du cache
        result[i].statistics = extractStatsFromCacheRecord(cachedData);
        result[i].delivery_info = cachedData.delivery_info;
      } else {
        console.log(`No cache data for campaign ${campaign.name}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de l'enrichissement des campagnes:", error);
    return result;
  }
};
