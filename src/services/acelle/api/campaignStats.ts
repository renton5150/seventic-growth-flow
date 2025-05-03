
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Formatte les statistiques brutes de l'API en un format standardisé
 */
export function formatCampaignStatistics(rawStats: any): AcelleCampaignStatistics {
  return {
    subscriber_count: rawStats.subscriber_count || 0,
    delivered_count: rawStats.delivered_count || 0,
    delivered_rate: rawStats.delivered_rate || 0,
    open_count: rawStats.open_count || 0,
    uniq_open_count: rawStats.unique_opens_count || rawStats.uniq_open_count || 0,
    uniq_open_rate: rawStats.unique_open_rate || rawStats.uniq_open_rate || 0,
    click_count: rawStats.click_count || 0,
    click_rate: rawStats.click_rate || 0,
    bounce_count: rawStats.bounce_count || rawStats.bounces_count || 0,
    soft_bounce_count: rawStats.soft_bounce_count || 0,
    hard_bounce_count: rawStats.hard_bounce_count || 0,
    unsubscribe_count: rawStats.unsubscribe_count || 0,
    abuse_complaint_count: rawStats.abuse_complaint_count || rawStats.complaint_count || 0
  };
}

/**
 * Met à jour le cache des statistiques de campagne dans Supabase
 */
export async function updateCampaignStatsCache(
  campaignUid: string, 
  accountId: string, 
  statistics: AcelleCampaignStatistics, 
  delivery_info: DeliveryInfo
) {
  try {
    // Rechercher la campagne dans le cache
    const { data: existingCampaign } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (!existingCampaign) {
      console.warn(`Campagne ${campaignUid} non trouvée dans le cache, impossible de mettre à jour les stats`);
      return;
    }
    
    // Conversion de delivery_info en objet simple pour éviter les erreurs de typage JSON
    const deliveryInfoJson = {
      total: delivery_info.total || 0,
      delivery_rate: delivery_info.delivery_rate || 0,
      unique_open_rate: delivery_info.unique_open_rate || 0,
      click_rate: delivery_info.click_rate || 0,
      bounce_rate: delivery_info.bounce_rate || 0,
      unsubscribe_rate: delivery_info.unsubscribe_rate || 0,
      delivered: delivery_info.delivered || 0,
      opened: delivery_info.opened || 0,
      clicked: delivery_info.clicked || 0,
      bounced: typeof delivery_info.bounced === 'object' ? delivery_info.bounced.total : delivery_info.bounced || 0,
      unsubscribed: delivery_info.unsubscribed || 0,
      complained: delivery_info.complained || 0
    };
    
    const { error } = await supabase
      .from('email_campaigns_cache')
      .update({
        delivery_info: deliveryInfoJson,
        cache_updated_at: new Date().toISOString()
      })
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId);
      
    if (error) {
      console.error("Erreur lors de la mise à jour du cache:", error);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache de statistiques:", error);
  }
}

/**
 * Récupère et traite les statistiques d'une campagne
 */
export async function fetchAndProcessCampaignStats(
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: { demoMode?: boolean } = {}
) {
  const campaignUid = campaign?.uid || campaign?.campaign_uid;
  
  if (options.demoMode) {
    // En mode démo, générer des stats aléatoires
    const demoStats = generateSimulatedStats();
    return {
      statistics: demoStats.statistics as AcelleCampaignStatistics,
      delivery_info: demoStats.delivery_info as DeliveryInfo
    };
  }
  
  // Utiliser les stats existantes si disponibles
  if (campaign.statistics || campaign.delivery_info) {
    let statistics: AcelleCampaignStatistics;
    let delivery_info: DeliveryInfo;
    
    if (campaign.statistics) {
      statistics = campaign.statistics;
      delivery_info = campaign.delivery_info || createDeliveryInfoFromStats(statistics);
    } else if (campaign.delivery_info) {
      delivery_info = campaign.delivery_info;
      statistics = createStatsFromDeliveryInfo(delivery_info);
    }
    
    return { statistics, delivery_info };
  }
  
  // Si aucune stat n'est disponible, générer des stats simulées
  return {
    statistics: generateSimulatedStats().statistics as AcelleCampaignStatistics,
    delivery_info: generateSimulatedStats().delivery_info as DeliveryInfo
  };
}

/**
 * Crée un objet DeliveryInfo à partir de statistiques
 */
function createDeliveryInfoFromStats(stats: AcelleCampaignStatistics): DeliveryInfo {
  return {
    total: stats.subscriber_count || 0,
    delivered: stats.delivered_count || 0,
    delivery_rate: stats.delivered_rate || 0,
    opened: stats.open_count || 0,
    unique_open_rate: stats.uniq_open_rate || 0,
    clicked: stats.click_count || 0,
    click_rate: stats.click_rate || 0,
    bounced: stats.bounce_count || 0,
    unsubscribed: stats.unsubscribe_count || 0,
    complained: stats.abuse_complaint_count || 0
  };
}

/**
 * Crée un objet AcelleCampaignStatistics à partir de DeliveryInfo
 */
function createStatsFromDeliveryInfo(info: DeliveryInfo): AcelleCampaignStatistics {
  return {
    subscriber_count: info.total || 0,
    delivered_count: info.delivered || 0,
    delivered_rate: info.delivery_rate || 0,
    open_count: info.opened || 0,
    uniq_open_count: 0, // pas disponible dans delivery_info
    uniq_open_rate: info.unique_open_rate || 0,
    click_count: info.clicked || 0,
    click_rate: info.click_rate || 0,
    bounce_count: typeof info.bounced === 'object' ? info.bounced.total : info.bounced || 0,
    soft_bounce_count: typeof info.bounced === 'object' ? info.bounced.soft || 0 : 0,
    hard_bounce_count: typeof info.bounced === 'object' ? info.bounced.hard || 0 : 0,
    unsubscribe_count: info.unsubscribed || 0,
    abuse_complaint_count: info.complained || 0
  };
}

/**
 * Génère des statistiques simulées pour le mode démo
 */
export function generateSimulatedStats(): Record<string, any> {
  const subCount = Math.floor(Math.random() * 1000) + 100;
  const deliveredCount = Math.floor(subCount * (0.92 + Math.random() * 0.08));
  const deliveredRate = deliveredCount / subCount;
  
  const openCount = Math.floor(deliveredCount * (0.3 + Math.random() * 0.5));
  const uniqOpenRate = openCount / deliveredCount;
  
  const clickCount = Math.floor(openCount * (0.1 + Math.random() * 0.3));
  const clickRate = clickCount / deliveredCount;
  
  const bounceCount = subCount - deliveredCount;
  const softBounce = Math.floor(bounceCount * (0.7 + Math.random() * 0.3));
  const hardBounce = bounceCount - softBounce;
  
  const unsubCount = Math.floor(deliveredCount * Math.random() * 0.02);
  const complaintCount = Math.floor(deliveredCount * Math.random() * 0.005);
  
  const statistics = {
    subscriber_count: subCount,
    delivered_count: deliveredCount,
    delivered_rate: deliveredRate,
    open_count: openCount,
    uniq_open_count: openCount,
    uniq_open_rate: uniqOpenRate,
    click_count: clickCount,
    click_rate: clickRate,
    bounce_count: bounceCount,
    soft_bounce_count: softBounce,
    hard_bounce_count: hardBounce,
    unsubscribe_count: unsubCount,
    abuse_complaint_count: complaintCount
  };
  
  const delivery_info = {
    total: subCount,
    delivered: deliveredCount,
    delivery_rate: deliveredRate,
    opened: openCount,
    unique_open_rate: uniqOpenRate,
    clicked: clickCount,
    click_rate: clickRate,
    bounced: {
      total: bounceCount,
      soft: softBounce,
      hard: hardBounce
    },
    unsubscribed: unsubCount,
    complained: complaintCount
  };
  
  return { statistics, delivery_info };
}
