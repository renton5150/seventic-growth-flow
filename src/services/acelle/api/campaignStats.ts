
// Fichier de compatibilité pour assurer la rétrocompatibilité avec le code existant
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { 
  fetchAndProcessCampaignStats as fetchAndProcessStats,
  testCacheInsertion,
  ensureValidStatistics 
} from "./stats/campaignStats";
import { enrichCampaignsWithStats } from "./stats/directStats";

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
): Promise<AcelleCampaign> => {
  const result = await fetchAndProcessStats(campaign, account, options);
  return result as AcelleCampaign;
};

// Re-export utility functions
export { 
  testCacheInsertion,
  ensureValidStatistics, 
  enrichCampaignsWithStats 
};

