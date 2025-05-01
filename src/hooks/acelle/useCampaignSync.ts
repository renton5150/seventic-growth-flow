
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { getAcelleCampaigns } from "@/services/acelle/api/campaigns";
import { updateLastSyncDate } from "@/services/acelle/api/accounts";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

interface SyncResult {
  error?: string;
  success: boolean;
  debugInfo?: AcelleConnectionDebug;
}

export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Enhanced sync function that returns status
  const syncCampaignsCache = async (options: { quietMode?: boolean; forceSync?: boolean } = {}) => {
    const { quietMode = false, forceSync = false } = options;
    if (!quietMode) setIsSyncing(true);
    if (!quietMode) setSyncError(null);
    
    const result: SyncResult = { success: false };
    
    try {
      if (!account?.id || account?.status !== 'active') {
        result.error = "Account inactive or invalid";
        return result;
      }
      
      // Fetch all campaigns (without pagination)
      let allCampaigns = [];
      let page = 1;
      const limit = 50; // Adjust the limit as needed
      let hasMore = true;

      while (hasMore) {
        const campaigns = await getAcelleCampaigns(account, page, limit);
        if (campaigns && campaigns.length > 0) {
          allCampaigns = allCampaigns.concat(campaigns);
          page++;
          hasMore = campaigns.length === limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`Synced ${allCampaigns.length} campaigns for account ${account.name}`);

      // Update last sync date
      await updateLastSyncDate(account.id);
      
      result.success = true;
      return result;
    } catch (error: any) {
      console.error(`Campaign sync failed for account ${account.name}:`, error);
      result.error = error.message || 'Sync failed';
      if (!quietMode) setSyncError(error.message || 'Sync failed');
      return result;
    } finally {
      if (!quietMode) setIsSyncing(false);
    }
  };
  
  // Wake up edge functions 
  const wakeUpEdgeFunctions = async () => {
    try {
      // Implement wake-up mechanism here
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      const wakeUpPromises = [
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        }).catch(() => console.log("Wake-up attempt for cors-proxy completed"))
      ];
      
      await Promise.all(wakeUpPromises);
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      return false;
    }
  };
  
  // Check if API endpoints are available
  const checkApiAvailability = async () => {
    try {
      const connectionDebug = await testAcelleConnection(account);
      setDebugInfo(connectionDebug);
      return {
        available: connectionDebug.success,
        debugInfo: connectionDebug
      };
    } catch (e) {
      console.error("API availability check failed:", e);
      return {
        available: false,
        error: e instanceof Error ? e.message : "Unknown error",
        debugInfo: null
      };
    }
  };
  
  // Get debug info
  const getDebugInfo = () => {
    return debugInfo;
  };

  useEffect(() => {
    if (account?.id && account?.status === 'active') {
      // Run the sync immediately when the component mounts
      syncCampaignsCache();

      // Set up the interval to run the sync periodically
      const intervalId = setInterval(() => syncCampaignsCache(), syncInterval);

      // Clean up the interval when the component unmounts or the account changes
      return () => clearInterval(intervalId);
    }
  }, [account, syncInterval]);

  return { 
    isSyncing, 
    syncError, 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    getDebugInfo 
  };
};
