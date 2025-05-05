
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { enrichCampaignsWithStats as enrichWithDirectStats } from "./directStats";

/**
 * Récupère et traite les statistiques pour une liste de campagnes
 */
export const fetchAndProcessCampaignStats = async (
  campaigns: AcelleCampaign | AcelleCampaign[],
  account: AcelleAccount,
  options?: { 
    refresh?: boolean;
    demoMode?: boolean;
  }
): Promise<AcelleCampaign | AcelleCampaign[]> => {
  try {
    // Handle demo mode with mock data
    if (options?.demoMode) {
      return Array.isArray(campaigns)
        ? addMockStatistics(campaigns)
        : addMockStatisticsSingle(campaigns);
    }
    
    // Handle single campaign case
    if (!Array.isArray(campaigns)) {
      const campaignsArray = await enrichWithDirectStats([campaigns], account, {
        forceRefresh: options?.refresh
      });
      return campaignsArray[0];
    }
    
    // Handle multiple campaigns case
    return enrichWithDirectStats(campaigns, account, {
      forceRefresh: options?.refresh
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    // Return the original campaigns without modification in case of error
    return campaigns;
  }
};

/**
 * Re-export enrichCampaignsWithStats for compatibility
 */
export { enrichCampaignsWithStats } from "./directStats";
export { ensureValidStatistics } from "./validation";

/**
 * Ajoute des statistiques simulées à une seule campagne (utilisé pour le mode démo)
 */
const addMockStatisticsSingle = (campaign: AcelleCampaign): AcelleCampaign => {
  const mockCampaigns = addMockStatistics([campaign]);
  return mockCampaigns[0];
};

/**
 * Ajoute des statistiques simulées aux campagnes (utilisé pour le mode démo)
 */
export const addMockStatistics = (campaigns: AcelleCampaign[]): AcelleCampaign[] => {
  return campaigns.map(campaign => {
    // Générer des statistiques fictives
    const totalEmails = Math.floor(Math.random() * 1000) + 200;
    const deliveredRate = 0.97 + Math.random() * 0.02;
    const delivered = Math.floor(totalEmails * deliveredRate);
    const openRate = 0.3 + Math.random() * 0.4;
    const opened = Math.floor(delivered * openRate);
    const uniqueOpenRate = openRate * 0.9; // Slightly lower than total opens
    const uniqueOpens = Math.floor(opened * 0.9);
    const clickRate = 0.1 + Math.random() * 0.3;
    const clicked = Math.floor(opened * clickRate);
    const bounceCount = totalEmails - delivered;

    const mockStats = ensureValidStatistics({
      subscriber_count: totalEmails,
      delivered_count: delivered,
      delivered_rate: deliveredRate * 100,
      open_count: opened,
      uniq_open_count: uniqueOpens,
      uniq_open_rate: uniqueOpenRate * 100,
      click_count: clicked,
      click_rate: clickRate * 100,
      bounce_count: bounceCount,
      soft_bounce_count: Math.floor(bounceCount * 0.7),
      hard_bounce_count: Math.floor(bounceCount * 0.3),
      unsubscribe_count: Math.floor(delivered * 0.02),
      abuse_complaint_count: Math.floor(delivered * 0.005),
    });

    return {
      ...campaign,
      statistics: mockStats
    };
  });
};
