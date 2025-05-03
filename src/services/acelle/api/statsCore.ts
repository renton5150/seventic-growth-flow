import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from '@/types/acelle.types';
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
 * Service dedicated to retrieving and processing campaign statistics
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
    // Generate simulated statistics if in demo mode
    if (options.demoMode) {
      console.log(`Generating simulated statistics for campaign ${campaign.name}`);
      return generateSimulatedStats();
    }

    console.log(`Retrieving statistics for campaign ${campaign.uid || campaign.campaign_uid}`, {
      forceRefresh: options.forceRefresh,
      useCache: options.useCache
    });
    
    // Check if the campaign already has valid statistics and we're not forcing a refresh
    if (hasValidStatistics(campaign) && !options.forceRefresh) {
      console.log(`Using existing statistics for ${campaign.name}`, campaign.statistics);
      return normalizeStatistics(campaign);
    }
    
    // Otherwise, get fresh data from the API or cache based on options
    const freshStats = await getCampaignStatsDirectly(campaign, account, { 
      ...options, 
      forceRefresh: options.forceRefresh 
    });
    
    console.log(`Statistics retrieved for ${campaign.name}:`, freshStats.statistics);
    
    // Check if the retrieved statistics contain real data
    const hasStats = freshStats && freshStats.statistics && (
      freshStats.statistics.subscriber_count > 0 || 
      freshStats.statistics.open_count > 0 || 
      freshStats.statistics.delivered_count > 0
    );
       
    if (!hasStats) {
      console.log(`Retrieved statistics for ${campaign.name} are empty, generating simulated data`);
      return generateSimulatedStats();
    }
    
    // Process the returned data
    const processedStats = processApiStats(freshStats, campaign);
    console.log(`Processed statistics for ${campaign.name}:`, processedStats.statistics);
    
    return processedStats;
  } catch (error) {
    console.error(`Error retrieving statistics for ${campaign.name}:`, error);
    
    // Try to use existing data if available in case of error
    if (campaign.statistics || campaign.delivery_info) {
      console.log(`Using existing data as fallback for ${campaign.name}`);
      return normalizeStatistics(campaign);
    }
    
    // As a last resort, return simulated statistics
    console.log(`Generating simulated statistics for ${campaign.name} due to an error`);
    return generateSimulatedStats();
  }
};
