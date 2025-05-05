import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { enrichCampaignsWithStats as enrichWithDirectStats } from "./directStats";

/**
 * Test function for cache insertion
 */
export const testCacheInsertion = async (account: AcelleAccount): Promise<boolean> => {
  if (!account?.id) return false;
  
  try {
    // Create a test campaign with mock data
    const testCampaign: AcelleCampaign = {
      uid: `test-${Date.now()}`,
      name: "Test Campaign",
      subject: "Test Subject",
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivery_date: null,
      run_at: null,
      statistics: {
        subscriber_count: 0,
        delivered_count: 0,
        delivered_rate: 0,
        open_count: 0,
        uniq_open_count: 0,
        uniq_open_rate: 0,
        click_count: 0,
        click_rate: 0,
        bounce_count: 0,
        soft_bounce_count: 0,
        hard_bounce_count: 0,
        unsubscribe_count: 0,
        abuse_complaint_count: 0
      }
    };
    
    // Try to process the test campaign
    const result = await fetchAndProcessCampaignStats(testCampaign, account);
    return !!result;
  } catch (error) {
    console.error("Error during cache test:", error);
    return false;
  }
};

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

// Re-export addMockStatistics for testing purposes
export { addMockStatistics } from "./campaignStats";

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
