
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { getCampaignStatsDirectly } from "./directStats";
import { generateSimulatedStats } from "./statsGeneration";
import { normalizeStatistics, processApiStats } from "./statsNormalization";
import { hasValidStatistics } from "./statsValidation";

interface FetchStatsOptions {
  demoMode?: boolean;
  useCache?: boolean;
  skipProcessing?: boolean;
  forceRefresh?: boolean;
}

/**
 * Service dédié à la récupération et au traitement des statistiques de campagne
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: FetchStatsOptions = {}
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: DeliveryInfo;
}> => {
  try {
    // Si mode démo, générer des statistiques simulées
    if (options.demoMode) {
      console.log(`Génération de statistiques simulées pour la campagne ${campaign.name}`);
      return generateSimulatedStats();
    }

    console.log(`Récupération des statistiques pour la campagne ${campaign.uid || campaign.campaign_uid}`, {
      forceRefresh: options.forceRefresh,
      useCache: options.useCache
    });
    
    // Vérifier si la campagne a déjà des statistiques valides et qu'on ne force pas le rafraîchissement
    if (hasValidStatistics(campaign) && !options.forceRefresh) {
      console.log(`Utilisation des statistiques existantes pour ${campaign.name}`, campaign.statistics);
      return normalizeStatistics(campaign);
    }
    
    // Sinon, récupérer depuis l'API ou le cache selon les options
    const freshStats = await getCampaignStatsDirectly(campaign, account, options);
    console.log(`Statistiques récupérées pour ${campaign.name}:`, freshStats.statistics);
    
    // Vérifier si les statistiques récupérées contiennent des données réelles
    const hasStats = freshStats && freshStats.statistics && 
      (freshStats.statistics.subscriber_count > 0 || 
       freshStats.statistics.open_count > 0 || 
       freshStats.statistics.delivered_count > 0);
       
    if (!hasStats) {
      console.log(`Les statistiques récupérées pour ${campaign.name} sont vides, génération de données simulées`);
      return generateSimulatedStats();
    }
    
    // Traitement des données retournées
    const processedStats = processApiStats(freshStats, campaign);
    console.log(`Statistiques traitées pour ${campaign.name}:`, processedStats.statistics);
    
    return processedStats;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaign.name}:`, error);
    
    // En cas d'erreur, essayer d'utiliser les données existantes si disponibles
    if (campaign.statistics || campaign.delivery_info) {
      console.log(`Utilisation des données existantes comme fallback pour ${campaign.name}`);
      return normalizeStatistics(campaign);
    }
    
    // En dernier recours, retourner des statistiques simulées
    console.log(`Génération de statistiques simulées pour ${campaign.name} suite à une erreur`);
    return generateSimulatedStats();
  }
};
