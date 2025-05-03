
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { generateSimulatedStats } from './statsGeneration';
import { verifyStatistics, extractStatsFromCacheRecord } from './optimizedStats';

/**
 * Enrich a list of campaigns with their statistics
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount
): Promise<AcelleCampaign[]> => {
  // If no campaigns, return an empty array
  if (!campaigns || campaigns.length === 0) {
    return [];
  }
  
  console.log(`Enriching ${campaigns.length} campaigns with statistics`);
  
  // Clone campaigns to avoid mutating the originals
  const result = JSON.parse(JSON.stringify(campaigns)) as AcelleCampaign[];
  
  // Get the campaign UIDs
  const campaignUids = result
    .filter(c => c.uid || c.campaign_uid)
    .map(c => c.uid || c.campaign_uid || '');
    
  if (campaignUids.length === 0) {
    console.log("No valid campaign UIDs found for enrichment");
    return generateFallbackStats(result);
  }
  
  try {
    // Retrieve cache data for all campaigns at once
    console.log(`Fetching cache data for ${campaignUids.length} campaigns`);
    const { data: cachedCampaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('campaign_uid', campaignUids)
      .eq('account_id', account.id);
      
    if (error) {
      console.error("Error retrieving cached statistics:", error);
      return generateFallbackStats(result);
    }
    
    console.log(`Found ${cachedCampaigns?.length || 0} campaigns in cache with potential statistics`);
    
    // Create a map for quick access
    const cacheMap = new Map();
    cachedCampaigns?.forEach(cache => {
      if (cache.campaign_uid) {
        cacheMap.set(cache.campaign_uid, cache);
      }
    });
    
    // Enrich each campaign with its statistics
    for (let i = 0; i < result.length; i++) {
      const campaign = result[i];
      const campaignUid = campaign.uid || campaign.campaign_uid;
      const cachedData = campaignUid ? cacheMap.get(campaignUid) : null;
      
      if (cachedData?.delivery_info) {
        console.log(`Found cache data with statistics for campaign ${campaign.name}`);
        
        // Check if the cached data has actual statistics or just empty values
        const hasRealStats = verifyStatistics(cachedData.delivery_info);
        
        if (hasRealStats) {
          // Extract statistics from cache
          const stats = extractStatsFromCacheRecord(cachedData);
          result[i].statistics = stats;
          result[i].delivery_info = cachedData.delivery_info;
          
          console.log(`Enriched with real statistics for ${campaign.name}:`, stats);
        } else {
          console.log(`Cache found for ${campaign.name} but no real statistics`);
          const { statistics, delivery_info } = generateSimulatedStats();
          result[i].statistics = statistics;
          result[i].delivery_info = delivery_info;
        }
      } else {
        // When no cache data is found, generate simulated stats
        console.log(`No cache data with statistics for campaign ${campaign.name}`);
        const { statistics, delivery_info } = generateSimulatedStats();
        result[i].statistics = statistics;
        result[i].delivery_info = delivery_info;
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error enriching campaigns:", error);
    return generateFallbackStats(result);
  }
};

/**
 * Generate simulated stats for all campaigns
 */
function generateFallbackStats(campaigns: AcelleCampaign[]): AcelleCampaign[] {
  return campaigns.map(campaign => {
    const { statistics, delivery_info } = generateSimulatedStats();
    return {
      ...campaign,
      statistics,
      delivery_info
    };
  });
}
