
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupère et traite les statistiques d'une campagne, soit depuis les données existantes,
 * soit en générant des données démo si demandé
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign, 
  account: AcelleAccount,
  options?: {
    demoMode?: boolean;
    refresh?: boolean;
  }
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info?: Record<string, any>;
}> => {
  try {
    // Mode démo: générer des statistiques fictives
    if (options?.demoMode) {
      return generateDemoStats();
    }
    
    // Récupérer les statistiques depuis les données de la campagne
    let statistics: AcelleCampaignStatistics = campaign.statistics || createEmptyStatistics();
    let deliveryInfo = campaign.delivery_info || {};
    
    // Si les statistiques ne sont pas complètes, essayer de les enrichir
    if (!statistics.subscriber_count && !deliveryInfo.total) {
      console.log(`Statistiques incomplètes pour la campagne ${campaign.uid}, tentative d'enrichissement`);
      
      // Pour l'instant, nous utilisons simplement ce que nous avons
      // À l'avenir, nous pourrions implémenter une requête API pour des statistiques plus détaillées
    }
    
    return {
      statistics,
      delivery_info: deliveryInfo
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques de campagne:", error);
    return {
      statistics: createEmptyStatistics()
    };
  }
};

// Fonction pour générer des statistiques de démo
const generateDemoStats = (): {
  statistics: AcelleCampaignStatistics;
  delivery_info: Record<string, any>;
} => {
  const totalSubscribers = Math.floor(Math.random() * 1000) + 500;
  const deliveredCount = Math.floor(totalSubscribers * (0.97 + Math.random() * 0.03));
  const openCount = Math.floor(deliveredCount * (0.3 + Math.random() * 0.4));
  const clickCount = Math.floor(openCount * (0.2 + Math.random() * 0.3));
  const bounceCount = totalSubscribers - deliveredCount;
  const softBounce = Math.floor(bounceCount * 0.7);
  const hardBounce = bounceCount - softBounce;
  
  const statistics: AcelleCampaignStatistics = {
    subscriber_count: totalSubscribers,
    delivered_count: deliveredCount,
    delivered_rate: +(deliveredCount / totalSubscribers * 100).toFixed(1),
    open_count: openCount,
    uniq_open_rate: +(openCount / deliveredCount * 100).toFixed(1),
    click_count: clickCount,
    click_rate: +(clickCount / deliveredCount * 100).toFixed(1),
    bounce_count: bounceCount,
    soft_bounce_count: softBounce,
    hard_bounce_count: hardBounce,
    unsubscribe_count: Math.floor(deliveredCount * 0.01),
    abuse_complaint_count: Math.floor(deliveredCount * 0.002)
  };
  
  const deliveryInfo = {
    total: totalSubscribers,
    delivered: deliveredCount,
    delivery_rate: +(deliveredCount / totalSubscribers * 100).toFixed(1),
    opened: openCount,
    unique_open_rate: +(openCount / deliveredCount * 100).toFixed(1),
    clicked: clickCount,
    click_rate: +(clickCount / deliveredCount * 100).toFixed(1),
    bounced: {
      soft: softBounce,
      hard: hardBounce,
      total: bounceCount
    },
    unsubscribed: Math.floor(deliveredCount * 0.01),
    complained: Math.floor(deliveredCount * 0.002),
    unsubscribe_rate: +(Math.floor(deliveredCount * 0.01) / deliveredCount * 100).toFixed(1),
    bounce_rate: +(bounceCount / totalSubscribers * 100).toFixed(1)
  };
  
  return { statistics, delivery_info: deliveryInfo };
};
