import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { fetchCampaignStatisticsFromApi } from "./apiClient";
import { getCachedStatistics, saveCampaignStatistics } from "./cacheManager";

/**
 * Enrichit les campagnes avec des statistiques en utilisant l'API directe ou le cache
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length) return campaigns;
  
  const forceRefresh = options?.forceRefresh || false;
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || '';
      let statistics: AcelleCampaignStatistics | null = null;
      
      if (!forceRefresh) {
        // Try to get from cache first if not forcing refresh
        statistics = await getCachedStatistics(campaignUid, account.id);
      }
      
      // If not found in cache or forcing refresh, fetch from API
      if (!statistics) {
        statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
        
        if (statistics) {
          // Save to cache for future use
          await saveCampaignStatistics(campaignUid, account.id, statistics);
        }
      }
      
      // Add statistics to campaign
      enrichedCampaigns.push({
        ...campaign,
        statistics: statistics ? ensureValidStatistics(statistics) : null
      });
    } catch (error) {
      console.error(`Error enriching campaign ${campaign.uid} with stats:`, error);
      // Still include the campaign without statistics
      enrichedCampaigns.push(campaign);
    }
  }
  
  return enrichedCampaigns;
};

// Other exports for compatibility with other modules
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    return await fetchCampaignStatisticsFromApi(campaignUid, account);
  } catch (error) {
    console.error(`Error fetching direct statistics for campaign ${campaignUid}:`, error);
    return null;
  }
};
