
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";
import { callAcelleApi } from '../acelle-service';
import { toast } from 'sonner';

/**
 * Récupère et traite les statistiques d'une campagne directement depuis l'API Acelle,
 * utilise les données existantes comme fallback, et ne génère des démos que si explicitement demandé
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
    // Mode démo: générer des statistiques fictives seulement si explicitement demandé
    if (options?.demoMode) {
      console.log(`Génération de statistiques démo pour la campagne ${campaign.uid}`);
      return generateDemoStats(campaign);
    }
    
    // Utiliser les données existantes si disponibles et si on ne demande pas de rafraîchissement
    if (!options?.refresh && campaign.statistics && campaign.statistics.subscriber_count > 0) {
      console.log(`Utilisation des statistiques existantes pour la campagne ${campaign.uid}`);
      return {
        statistics: campaign.statistics,
        delivery_info: campaign.delivery_info || {}
      };
    }
    
    // Récupérer les statistiques depuis l'API Acelle
    console.log(`Tentative de récupération des statistiques depuis l'API pour la campagne ${campaign.uid}`);
    
    if (!account || !account.apiToken || !account.apiEndpoint) {
      console.error("Informations de compte Acelle incomplètes:", { 
        hasAccount: !!account, 
        hasToken: !!account?.apiToken, 
        hasEndpoint: !!account?.apiEndpoint 
      });
      throw new Error("Informations de compte Acelle incomplètes pour l'appel API");
    }
    
    try {
      // Construire les paramètres pour l'API
      const params = {
        api_token: account.apiToken,
        uid: campaign.uid,
        _t: Date.now().toString() // Anti-cache
      };
      
      // Vérifier que l'endpoint est correctement formaté
      let apiEndpoint = account.apiEndpoint;
      if (!apiEndpoint) {
        console.error("Endpoint API non défini:", account);
        throw new Error("L'endpoint API n'est pas défini");
      }
      
      // S'assurer que l'endpoint ne se termine pas par un slash
      if (apiEndpoint.endsWith('/')) {
        apiEndpoint = apiEndpoint.slice(0, -1);
      }
      
      // Journaliser pour le débogage
      console.log(`Appel API pour récupérer les statistiques de la campagne ${campaign.uid}`, {
        endpoint: apiEndpoint,
        campaignId: campaign.uid
      });
      
      // Appel à l'API Acelle pour récupérer les stats
      const endpoint = `campaigns/${campaign.uid}`;
      
      const campaignData = await callAcelleApi(endpoint, params);
      
      if (!campaignData) {
        throw new Error(`Aucune donnée retournée par l'API pour la campagne ${campaign.uid}`);
      }
      
      console.log(`Données reçues de l'API pour la campagne ${campaign.uid}:`, campaignData);
      
      // Extraire les statistiques
      const apiStats = campaignData.statistics || {};
      
      // Créer des statistiques correctement formatées
      const statistics: AcelleCampaignStatistics = {
        subscriber_count: parseInt(apiStats.subscriber_count) || 0,
        delivered_count: parseInt(apiStats.delivered_count) || 0,
        delivered_rate: parseFloat(apiStats.delivered_rate) || 0,
        open_count: parseInt(apiStats.open_count) || 0,
        uniq_open_rate: parseFloat(apiStats.uniq_open_rate) || 0,
        click_count: parseInt(apiStats.click_count) || 0,
        click_rate: parseFloat(apiStats.click_rate) || 0,
        bounce_count: parseInt(apiStats.bounce_count) || 0,
        soft_bounce_count: parseInt(apiStats.soft_bounce_count) || 0,
        hard_bounce_count: parseInt(apiStats.hard_bounce_count) || 0,
        unsubscribe_count: parseInt(apiStats.unsubscribe_count) || 0,
        abuse_complaint_count: parseInt(apiStats.abuse_complaint_count) || 0
      };
      
      // Créer une structure de données delivery_info cohérente
      const deliveryInfo = {
        total: parseInt(apiStats.subscriber_count) || 0,
        delivered: parseInt(apiStats.delivered_count) || 0,
        delivery_rate: parseFloat(apiStats.delivered_rate) || 0,
        opened: parseInt(apiStats.open_count) || 0,
        unique_open_rate: parseFloat(apiStats.uniq_open_rate) || 0,
        clicked: parseInt(apiStats.click_count) || 0,
        click_rate: parseFloat(apiStats.click_rate) || 0,
        bounced: {
          soft: parseInt(apiStats.soft_bounce_count) || 0,
          hard: parseInt(apiStats.hard_bounce_count) || 0,
          total: parseInt(apiStats.bounce_count) || 0
        },
        unsubscribed: parseInt(apiStats.unsubscribe_count) || 0,
        complained: parseInt(apiStats.abuse_complaint_count) || 0
      };
      
      console.log(`Statistiques extraites pour la campagne ${campaign.uid}:`, statistics);
      
      return {
        statistics,
        delivery_info: deliveryInfo
      };
    } catch (apiError) {
      console.error(`Erreur API pour la campagne ${campaign.uid}:`, apiError);
      
      // Si les statistiques existent déjà sur la campagne, on les utilise comme fallback
      if (campaign.statistics?.subscriber_count) {
        console.log(`Utilisation des statistiques existantes comme fallback pour la campagne ${campaign.uid}`);
        return {
          statistics: campaign.statistics,
          delivery_info: campaign.delivery_info || {}
        };
      }
      
      // Sinon, on renvoie des statistiques vides mais valides
      console.warn(`Aucune statistique disponible pour la campagne ${campaign.uid}, utilisation de stats vides`);
      return {
        statistics: createEmptyStatistics(),
        delivery_info: {}
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques de campagne:", error);
    
    // Renvoyer des statistiques vides
    return {
      statistics: createEmptyStatistics(),
      delivery_info: {}
    };
  }
};

// Fonction pour générer des statistiques de démo UNIQUEMENT quand explicitement demandé
const generateDemoStats = (campaign: AcelleCampaign): {
  statistics: AcelleCampaignStatistics;
  delivery_info: Record<string, any>;
} => {
  console.log(`Génération de statistiques démo explicites pour la campagne ${campaign.uid || 'inconnue'}`);
  
  // Créer des statistiques réalistes en fonction du statut de la campagne
  let totalSubscribers = Math.floor(Math.random() * 1000) + 500;
  let deliveryRate = 0.97 + Math.random() * 0.03; // 97-100% delivery rate
  let openRate = 0.3 + Math.random() * 0.4; // 30-70% open rate
  let clickRate = 0.2 + Math.random() * 0.3; // 20-50% click rate of opens
  
  // Ajuster en fonction du statut
  switch (campaign.status) {
    case 'new':
      // Nouvelle campagne, pas encore d'envois
      totalSubscribers = 0;
      deliveryRate = 0;
      openRate = 0;
      clickRate = 0;
      break;
    case 'queued':
      // En attente, pas encore d'envois
      deliveryRate = 0;
      openRate = 0;
      clickRate = 0;
      break;
    case 'sending':
      // En cours d'envoi, statistiques partielles
      deliveryRate = 0.3 + Math.random() * 0.5; // 30-80%
      openRate = 0.1 + Math.random() * 0.2; // 10-30%
      clickRate = 0.05 + Math.random() * 0.15; // 5-20%
      break;
    case 'paused':
      // Pause, statistiques partielles
      deliveryRate = 0.4 + Math.random() * 0.3; // 40-70%
      break;
    case 'failed':
      // Échec, taux de livraison faible
      deliveryRate = Math.random() * 0.3; // 0-30%
      break;
    // sent = valeurs par défaut (100% livraison)
  }
  
  const deliveredCount = Math.floor(totalSubscribers * deliveryRate);
  const openCount = Math.floor(deliveredCount * openRate);
  const clickCount = Math.floor(openCount * clickRate);
  const bounceCount = totalSubscribers - deliveredCount;
  const softBounce = Math.floor(bounceCount * 0.7);
  const hardBounce = bounceCount - softBounce;
  const unsubscribeCount = Math.floor(deliveredCount * 0.01);
  const complainedCount = Math.floor(deliveredCount * 0.002);
  
  const statistics: AcelleCampaignStatistics = {
    subscriber_count: totalSubscribers,
    delivered_count: deliveredCount,
    delivered_rate: +(deliveryRate * 100).toFixed(1),
    open_count: openCount,
    uniq_open_rate: +(openRate * 100).toFixed(1),
    click_count: clickCount,
    click_rate: +(clickRate * 100).toFixed(1),
    bounce_count: bounceCount,
    soft_bounce_count: softBounce,
    hard_bounce_count: hardBounce,
    unsubscribe_count: unsubscribeCount,
    abuse_complaint_count: complainedCount
  };
  
  const deliveryInfo = {
    total: totalSubscribers,
    delivered: deliveredCount,
    delivery_rate: +(deliveryRate * 100).toFixed(1),
    opened: openCount,
    unique_open_rate: +(openRate * 100).toFixed(1),
    clicked: clickCount,
    click_rate: +(clickRate * 100).toFixed(1),
    bounced: {
      soft: softBounce,
      hard: hardBounce,
      total: bounceCount
    },
    unsubscribed: unsubscribeCount,
    complained: complainedCount,
    unsubscribe_rate: +(unsubscribeCount / deliveredCount * 100).toFixed(1),
    bounce_rate: +(bounceCount / totalSubscribers * 100).toFixed(1)
  };
  
  console.log("Statistiques démo générées:", statistics);
  
  return { statistics, delivery_info: deliveryInfo };
};
