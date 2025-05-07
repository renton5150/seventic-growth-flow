
// Fichier de compatibilité pour assurer la rétrocompatibilité avec le code existant
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats as fetchAndProcessStats, testCacheInsertion } from "./stats/campaignStats";
import { enrichCampaignsWithStats } from "./stats/directStats";
import { ensureValidStatistics } from "./stats/validation";

/**
 * Récupère et traite les statistiques d'une campagne
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
  return fetchAndProcessStats(campaign, account, options);
};

// Re-exporter les fonctions utilitaires
export { testCacheInsertion, ensureValidStatistics, enrichCampaignsWithStats };
