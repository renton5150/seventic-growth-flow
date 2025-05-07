
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Test function to verify cache insertion functionality
 */
export const testCacheInsertion = async (account: any) => {
  try {
    console.log("Testing cache insertion for account:", account.name);
    
    // Create a test statistics object
    const testStats = {
      subscriber_count: 100,
      delivered_count: 95,
      delivered_rate: 95,
      open_count: 50,
      uniq_open_count: 45,
      uniq_open_rate: 45,
      click_count: 30,
      click_rate: 30,
      bounce_count: 5,
      soft_bounce_count: 3,
      hard_bounce_count: 2,
      unsubscribe_count: 2,
      abuse_complaint_count: 1
    };
    
    // Insert into cache with a test campaign ID
    const { error } = await supabase
      .from('campaign_stats_cache')
      .insert({
        campaign_uid: 'test-campaign-' + Date.now(),
        account_id: account.id,
        statistics: testStats as any,
        last_updated: new Date().toISOString()
      });
      
    if (error) {
      console.error("Cache test insertion error:", error);
      return false;
    }
    
    console.log("Cache test insertion successful");
    return true;
  } catch (err) {
    console.error("Error during cache test:", err);
    return false;
  }
};

/**
 * Get statistics for a campaign from cache
 */
export const getStatisticsFromCache = async (campaignId: string, accountId: string) => {
  const { data, error } = await supabase
    .from('campaign_stats_cache')
    .select('statistics, last_updated')
    .eq('campaign_uid', campaignId)
    .eq('account_id', accountId)
    .single();
    
  if (error || !data) {
    return { statistics: null, cachedAt: null };
  }
  
  return {
    statistics: data.statistics as AcelleCampaignStatistics,
    cachedAt: data.last_updated
  };
};

/**
 * Store campaign statistics in cache
 */
export const storeStatisticsInCache = async (
  campaignId: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
) => {
  try {
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        campaign_uid: campaignId,
        account_id: accountId,
        statistics: statistics as any,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid,account_id'
      });
      
    if (error) {
      console.error("Error storing campaign statistics in cache:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception storing campaign statistics in cache:", err);
    return false;
  }
};

/**
 * Clear cached statistics for a campaign
 */
export const clearCachedStatistics = async (campaignId: string, accountId: string) => {
  const { error } = await supabase
    .from('campaign_stats_cache')
    .delete()
    .eq('campaign_uid', campaignId)
    .eq('account_id', accountId);
    
  if (error) {
    console.error("Error clearing cached statistics:", error);
    return false;
  }
  
  return true;
};

/**
 * Clear all cached statistics for an account
 */
export const clearAccountCache = async (accountId: string) => {
  const { error } = await supabase
    .from('campaign_stats_cache')
    .delete()
    .eq('account_id', accountId);
    
  if (error) {
    console.error("Error clearing account cache:", error);
    return false;
  }
  
  return true;
};

/**
 * Get cached statistics with function name matching the import in directStats.ts
 */
export const getCachedStatistics = async (campaignId: string, accountId: string) => {
  const result = await getStatisticsFromCache(campaignId, accountId);
  return result.statistics;
};

/**
 * Save campaign statistics with function name matching the import in directStats.ts
 */
export const saveCampaignStatistics = async (campaignId: string, accountId: string, statistics: AcelleCampaignStatistics) => {
  return await storeStatisticsInCache(campaignId, accountId, statistics);
};
