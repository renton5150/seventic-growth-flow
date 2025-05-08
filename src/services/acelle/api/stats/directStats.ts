
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
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.error("Campaign is missing UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      let statistics: AcelleCampaignStatistics | null = null;
      
      if (!forceRefresh) {
        // Try to get from cache first if not forcing refresh
        console.log(`Looking for cached statistics for campaign ${campaignUid}`);
        statistics = await getCachedStatistics(campaignUid, account.id);
        
        if (statistics) {
          console.log(`Found cached statistics for campaign ${campaignUid}`);
        }
      }
      
      // If not found in cache or forcing refresh, fetch from API
      if (!statistics && account.api_endpoint && account.api_token) {
        console.log(`Fetching fresh statistics from API for campaign ${campaignUid} (force: ${forceRefresh})`);
        statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
        
        if (statistics) {
          // Save to cache for future use
          console.log(`Saving new statistics to cache for campaign ${campaignUid}`);
          await saveCampaignStatistics(campaignUid, account.id, statistics);
        } else {
          console.log(`No statistics returned from API for campaign ${campaignUid}`);
        }
      }
      
      // Add statistics to campaign
      enrichedCampaigns.push({
        ...campaign,
        statistics: statistics ? ensureValidStatistics(statistics) : campaign.statistics || null
      });
    } catch (error) {
      console.error(`Error enriching campaign ${campaign.uid || campaign.name} with stats:`, error);
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
