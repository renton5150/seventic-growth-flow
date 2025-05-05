
// Fichier de compatibilité pour assurer la rétrocompatibilité avec le code existant
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats as fetchAndProcessStats, ensureValidStatistics } from "./stats/campaignStats";
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
  // Ensure the result is usable even if it's just a campaign with optional properties
  return result as AcelleCampaign;
};

// Re-exporter les fonctions utilitaires
export { ensureValidStatistics, enrichCampaignsWithStats };
