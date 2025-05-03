
import { AcelleAccount, AcelleCampaign } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { generateSimulatedStats } from './statsGeneration';
import { verifyStatistics, extractStatsFromCacheRecord } from './optimizedStats';
import { createEmptyStatistics } from './statsUtils';
import { enrichCampaignsWithStats } from './enrichCampaigns';
import { refreshStatsCacheForCampaigns } from './cacheRefresh';

interface StatsOptions {
  demoMode?: boolean;
  useCache?: boolean;
  skipProcessing?: boolean;
  forceRefresh?: boolean;
}

/**
 * Directly fetch statistics from the Acelle API or database cache
 */
export const getCampaignStatsDirectly = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: StatsOptions = {}
) => {
  const { demoMode, useCache = true, forceRefresh = false } = options;
  
  if (demoMode) {
    console.log(`Demo mode active for ${campaign.name}, generating mock stats`);
    return generateSimulatedStats();
  }
  
  if (!campaign.uid && !campaign.campaign_uid) {
    console.error('Error: Missing campaign UID');
    throw new Error('Missing campaign UID');
  }
  
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  try {
    // If useCache is active and not forcing a refresh, first try to retrieve from cache
    if (useCache && !forceRefresh) {
      console.log(`Attempting to retrieve from cache for ${campaignUid}`);
      
      try {
        const { data: cachedCampaign, error } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .single();
          
        if (!error && cachedCampaign && cachedCampaign.delivery_info) {
          console.log(`Statistics found in cache for ${campaign.name}`, cachedCampaign.delivery_info);
          
          // Verify if the cached data contains actual statistics or is just an empty object
          const hasValidStats = verifyStatistics(cachedCampaign.delivery_info);
          
          if (hasValidStats) {
            console.log(`Valid statistics found in cache for ${campaign.name}`);
            // Return the formatted data
            return {
              statistics: extractStatsFromCacheRecord(cachedCampaign),
              delivery_info: cachedCampaign.delivery_info
            };
          } else {
            console.log(`Cache data exists for ${campaign.name} but contains no valid statistics`);
          }
        } else {
          console.log(`No statistics in cache for ${campaign.name}`, { error });
        }
      } catch (cacheError) {
        console.error('Error retrieving from cache:', cacheError);
      }
    }
    
    // If forcing a refresh or if nothing was found in cache
    if (forceRefresh || !useCache) {
      console.log(`Forcing refresh of statistics for ${campaign.name}`);
      
      // First, request a cache refresh
      if (campaignUid) {
        await refreshStatsCacheForCampaigns([campaignUid]);
        console.log(`Requested cache refresh for ${campaignUid}`);
      }
      
      // Then try to get fresh data from the database
      try {
        // Add a small delay to allow the database to update if a refresh was just triggered
        if (forceRefresh) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const { data: freshData, error } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .single();
          
        if (!error && freshData && freshData.delivery_info) {
          console.log(`Fresh statistics retrieved for ${campaign.name}`, freshData.delivery_info);
          
          // Verify if the fresh data contains actual statistics
          const hasValidStats = verifyStatistics(freshData.delivery_info);
          
          if (hasValidStats) {
            console.log(`Fresh data contains valid statistics for ${campaign.name}`);
            // Return the refreshed data
            return {
              statistics: extractStatsFromCacheRecord(freshData),
              delivery_info: freshData.delivery_info
            };
          } else {
            console.log(`Fresh data exists for ${campaign.name} but contains no valid statistics`);
            // Generate simulated statistics as fallback
            return generateSimulatedStats();
          }
        } else {
          console.log(`No fresh data found for ${campaign.name}`, { error });
          // Generate simulated statistics as fallback
          return generateSimulatedStats();
        }
      } catch (refreshError) {
        console.error('Error during forced refresh:', refreshError);
        // Generate simulated statistics in case of error
        return generateSimulatedStats();
      }
    }
    
    // If no cached data or cache not used, generate temporary statistics
    console.log(`No cache data or refresh requested, generating temporary statistics for ${campaign.name}`);
    return generateSimulatedStats();
    
  } catch (error) {
    console.error(`Error retrieving statistics for ${campaign.name}:`, error);
    // In case of error, generate simulated statistics
    return generateSimulatedStats();
  }
};

// Re-export the functions from the other modules for backward compatibility
export {
  enrichCampaignsWithStats,
  refreshStatsCacheForCampaigns,
  extractStatsFromCacheRecord,
  verifyStatistics,
  createEmptyStatistics
};
