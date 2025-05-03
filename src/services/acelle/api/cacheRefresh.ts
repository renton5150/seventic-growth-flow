
import { supabase } from '@/integrations/supabase/client';

/**
 * Function to refresh statistics cache for email campaigns
 */
export const refreshStatsCacheForCampaigns = async (campaignUids: string[]): Promise<boolean> => {
  if (!campaignUids.length) return false;
  
  console.log(`Refreshing statistics cache for ${campaignUids.length} campaigns`);
  
  try {
    // In a real application, we would make an API call and then update the cache
    // For this solution, we're simulating a refresh by updating the timestamp
    // and forcing a reload of the statistics
    
    // For each UID, update a flag in the database to trigger a refresh
    const promises = campaignUids.map(uid => 
      supabase
        .from('email_campaigns_cache')
        .update({ 
          updated_at: new Date().toISOString(),
          cache_updated_at: new Date().toISOString(), // Add this to explicitly mark as updated for the front end
          refresh_requested_at: new Date().toISOString() // Add a new field to track refresh requests
        })
        .eq('campaign_uid', uid)
    );
    
    await Promise.all(promises);
    console.log(`Statistics cache refresh requested for ${campaignUids.length} campaigns`);
    return true;
  } catch (error) {
    console.error("Error refreshing statistics cache:", error);
    return false;
  }
};
