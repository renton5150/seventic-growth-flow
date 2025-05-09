
// Fichier de compatibilité pour assurer la rétrocompatibilité avec le code existant
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats as fetchAndProcessStats } from "./stats/campaignStats";
import { enrichCampaignsWithStats } from "./stats/directStats";
import { ensureValidStatistics } from "./stats/validation";

/**
 * Récupère et traite les statistiques d'une campagne
 * Version simplifiée pour éviter les problèmes de cache
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options?: {
    refresh?: boolean;
    demoMode?: boolean;
  }
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: any;
}> => {
  const result = await fetchAndProcessStats(campaign, account, options);
  
  // Convert the result to the expected return type
  if (Array.isArray(result)) {
    // Should not happen, but handle just in case
    const firstCampaign = result[0];
    return {
      statistics: firstCampaign.statistics || {} as AcelleCampaignStatistics,
      delivery_info: firstCampaign.delivery_info || {}
    };
  } else {
    return {
      statistics: result.statistics || {} as AcelleCampaignStatistics,
      delivery_info: result.delivery_info || {}
    };
  }
};

// Re-exporter les fonctions utilitaires
export { ensureValidStatistics, enrichCampaignsWithStats };
