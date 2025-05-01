
import { useState } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing campaign cache operations
 */
export const useCampaignCache = (account: AcelleAccount) => {
  const [campaignsCount, setCampaignsCount] = useState<number>(0);

  // Get cached campaigns count
  const getCachedCampaignsCount = async () => {
    try {
      if (!account?.id) {
        return 0;
      }
      
      const { count } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact' })
        .eq('account_id', account.id);
      
      const actualCount = count || 0;
      setCampaignsCount(actualCount);
      return actualCount;
    } catch (error) {
      console.error("Error fetching cached campaigns count:", error);
      return 0;
    }
  };

  // Clear cache for an account
  const clearAccountCache = async () => {
    try {
      if (!account?.id) {
        return { success: false, error: "Invalid account ID" };
      }
      
      const { error } = await supabase
        .from('email_campaigns_cache')
        .delete()
        .eq('account_id', account.id);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      setCampaignsCount(0);
      return { success: true };
    } catch (error) {
      console.error("Error clearing account cache:", error);
      return { success: false, error: String(error) };
    }
  };

  return {
    campaignsCount,
    getCachedCampaignsCount,
    clearAccountCache
  };
};
