
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { fetchCampaignStatisticsFromApi, fetchCampaignStatisticsLegacy } from "./apiClient";

/**
 * Vérifie si les statistiques sont vides ou non initialisées
 * Une campagne est considérée comme ayant des statistiques vides si le nombre
 * de destinataires (subscriber_count) est à zéro
 */
export const hasEmptyStatistics = (statistics?: AcelleCampaignStatistics | null): boolean => {
  if (!statistics) return true;
  
  // Vérifier si les valeurs principales sont à zéro
  return statistics.subscriber_count === 0 || 
         statistics.subscriber_count === undefined || 
         statistics.subscriber_count === null;
};

/**
 * Enrichit les campagnes avec des statistiques en utilisant uniquement l'API directe
 * Version simplifiée et robuste qui tente d'abord la méthode directe puis la méthode legacy
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length) return campaigns;
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.error("Campaign is missing UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      console.log(`Récupération des statistiques depuis l'API pour la campagne ${campaignUid}`);
      
      // Tenter d'abord la nouvelle méthode directe
      let statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
      
      // Si échec avec la nouvelle méthode, essayer la méthode legacy
      if (!statistics) {
        console.log(`Tentative de récupération via méthode legacy pour la campagne ${campaignUid}`);
        statistics = await fetchCampaignStatisticsLegacy(campaignUid, account);
      }
      
      // Ajouter les statistiques à la campagne
      enrichedCampaigns.push({
        ...campaign,
        statistics: statistics ? ensureValidStatistics(statistics) : null,
        data_source: statistics ? 'api_direct' : 'cache'
      });
      
    } catch (error) {
      console.error(`Error enriching campaign ${campaign.uid || campaign.name} with stats:`, error);
      // Inclure quand même la campagne sans statistiques
      enrichedCampaigns.push(campaign);
    }
  }
  
  return enrichedCampaigns;
};

/**
 * Récupère les statistiques directement, en essayant d'abord la méthode directe puis la méthode legacy
 */
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`Tentative de récupération directe des statistiques pour ${campaignUid}`);
    
    // Tenter d'abord la méthode directe
    let stats = await fetchCampaignStatisticsFromApi(campaignUid, account);
    
    if (!stats) {
      console.log(`Échec de la méthode directe, tentative via legacy pour ${campaignUid}`);
      stats = await fetchCampaignStatisticsLegacy(campaignUid, account);
    }
    
    if (stats) {
      console.log(`Statistiques récupérées avec succès pour ${campaignUid}`);
    } else {
      console.error(`Aucune statistique n'a pu être récupérée pour ${campaignUid}`);
    }
    
    return stats;
  } catch (error) {
    console.error(`Error fetching direct statistics for campaign ${campaignUid}:`, error);
    return null;
  }
};

