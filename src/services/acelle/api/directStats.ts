
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./stats/campaignStats";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[], 
  account: AcelleAccount,
  options?: { 
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  
  // Vérification des informations du compte
  if (!account || !account.api_token || !account.api_endpoint) {
    console.error("Impossible d'enrichir les campagnes: informations de compte incomplètes", {
      hasAccount: !!account,
      hasToken: account ? !!account.api_token : false,
      hasEndpoint: account ? !!account.api_endpoint : false
    });
    return campaigns;
  }
  
  const enrichedCampaigns = [...campaigns];
  
  for (let i = 0; i < enrichedCampaigns.length; i++) {
    try {
      const campaign = enrichedCampaigns[i];
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement, on saute
      if (!options?.forceRefresh && 
          campaign.statistics && 
          (campaign.statistics.subscriber_count > 0 || 
           campaign.statistics.uniq_open_rate > 0 || 
           campaign.statistics.click_rate > 0)) {
        console.log(`Statistiques déjà disponibles pour la campagne ${campaign.name}, aucun enrichissement nécessaire`);
        continue;
      }
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`, {
        endpoint: account.api_endpoint,
        campaignId: campaign.uid || campaign.campaign_uid
      });
      
      // Récupérer les statistiques enrichies directement depuis l'API
      const enrichedCampaign = await fetchAndProcessCampaignStats(
        campaign, 
        account, 
        { refresh: true }
      ) as AcelleCampaign;
      
      // Normaliser les statistiques avant de les appliquer
      const normalizedStatistics = normalizeStatistics(enrichedCampaign.statistics);
      const normalizedDeliveryInfo = normalizeStatistics(enrichedCampaign.delivery_info);
      
      // Appliquer les statistiques enrichies à la campagne
      enrichedCampaigns[i] = {
        ...campaign,
        statistics: normalizedStatistics || createEmptyStatistics(),
        delivery_info: normalizedDeliveryInfo || {}
      };
      
      console.log(`Statistiques appliquées à la campagne ${campaign.name}:`, {
        statistics: {
          openRate: enrichedCampaigns[i].statistics?.uniq_open_rate,
          clickRate: enrichedCampaigns[i].statistics?.click_rate
        },
        delivery_info: {
          openRate: enrichedCampaigns[i].delivery_info?.uniq_open_rate,
          clickRate: enrichedCampaigns[i].delivery_info?.click_rate
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
      
      // Conserver les données existantes de la campagne
      console.log(`ERREUR: Impossible d'enrichir la campagne ${enrichedCampaigns[i].name}`);
    }
  }
  
  return enrichedCampaigns;
};

/**
 * Vérifie si les statistiques d'une campagne sont vides ou nulles
 */
export const hasEmptyStatistics = (statistics: any): boolean => {
  if (!statistics) return true;
  
  // Vérifier les champs clés pour déterminer si les stats sont vides
  const hasSubscribers = statistics.subscriber_count && parseFloat(String(statistics.subscriber_count)) > 0;
  const hasOpenRate = statistics.uniq_open_rate && parseFloat(String(statistics.uniq_open_rate)) > 0;
  const hasClickRate = statistics.click_rate && parseFloat(String(statistics.click_rate)) > 0;
  
  return !hasSubscribers && !hasOpenRate && !hasClickRate;
};

/**
 * Normalise les valeurs numériques dans un objet de statistiques
 */
const normalizeStatistics = (stats: any): any => {
  if (!stats) return null;
  
  const normalized = { ...stats };
  
  // Convertir les nombres
  const numericFields = [
    'subscriber_count', 'delivered_count', 'open_count', 'uniq_open_count', 
    'click_count', 'bounce_count', 'soft_bounce_count', 'hard_bounce_count',
    'unsubscribe_count', 'abuse_complaint_count', 'total'
  ];
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined) {
      normalized[field] = parseFloat(String(normalized[field])) || 0;
    }
  });
  
  // Convertir les pourcentages
  const rateFields = [
    'uniq_open_rate', 'open_rate', 'unique_open_rate', 'click_rate', 
    'delivered_rate', 'bounce_rate', 'unsubscribe_rate'
  ];
  
  rateFields.forEach(field => {
    if (normalized[field] !== undefined) {
      // Si c'est une chaîne, la nettoyer avant conversion
      if (typeof normalized[field] === 'string') {
        normalized[field] = parseFloat(normalized[field].replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
      } else {
        normalized[field] = parseFloat(String(normalized[field])) || 0;
      }
    }
  });
  
  return normalized;
};
