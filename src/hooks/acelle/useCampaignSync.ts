
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
  campaignsCount?: number;
}

export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [campaignsCount, setCampaignsCount] = useState<number>(0);

  // Enhanced sync function that returns status and properly caches campaigns
  const syncCampaignsCache = async (options: { quietMode?: boolean; forceSync?: boolean } = {}) => {
    const { quietMode = false, forceSync = false } = options;
    if (!quietMode) setIsSyncing(true);
    if (!quietMode) setSyncError(null);
    
    const result: SyncResult = { success: false };
    
    try {
      if (!account?.id || account?.status !== 'active') {
        result.error = "Account inactive or invalid";
        if (!quietMode) setSyncError("Compte inactif ou invalide");
        return result;
      }
      
      // Fetch a small number of campaigns first to check API access
      const connectionTest = await testAcelleConnection(account);
      setDebugInfo(connectionTest);
      
      if (!connectionTest.success) {
        result.error = connectionTest.errorMessage || "API inaccessible";
        result.debugInfo = connectionTest;
        if (!quietMode) setSyncError(result.error);
        return result;
      }
      
      // Fetch all campaigns (without pagination)
      let allCampaigns = [];
      let page = 1;
      const limit = 50; // Adjust the limit as needed
      let hasMore = true;
      let totalFetched = 0;

      if (!quietMode) toast.loading(`Synchronisation des campagnes en cours...`, { id: "sync-campaigns" });

      while (hasMore) {
        const campaigns = await getAcelleCampaigns(account, page, limit);
        if (campaigns && campaigns.length > 0) {
          allCampaigns = allCampaigns.concat(campaigns);
          totalFetched += campaigns.length;
          if (!quietMode && page > 1) {
            toast.loading(`Synchronisation: ${totalFetched} campagnes récupérées...`, { id: "sync-campaigns" });
          }
          page++;
          hasMore = campaigns.length === limit;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Fetched ${allCampaigns.length} campaigns for account ${account.name}`);
      setCampaignsCount(allCampaigns.length);
      
      // Now update the cache in Supabase
      if (allCampaigns.length > 0) {
        // Store campaigns in cache one by one to avoid size limitations
        for (const campaign of allCampaigns) {
          try {
            // Prepare the delivery_info object properly
            const deliveryInfo = {
              total: parseInt(campaign.statistics?.subscriber_count) || 0,
              delivered: parseInt(campaign.statistics?.delivered_count) || 0,
              delivery_rate: parseFloat(campaign.statistics?.delivered_rate) || 0,
              opened: parseInt(campaign.statistics?.open_count) || 0,
              unique_open_rate: parseFloat(campaign.statistics?.uniq_open_rate) || 0,
              clicked: parseInt(campaign.statistics?.click_count) || 0,
              click_rate: parseFloat(campaign.statistics?.click_rate) || 0,
              bounced: {
                soft: parseInt(campaign.statistics?.soft_bounce_count) || 0,
                hard: parseInt(campaign.statistics?.hard_bounce_count) || 0,
                total: parseInt(campaign.statistics?.bounce_count) || 0
              },
              unsubscribed: parseInt(campaign.statistics?.unsubscribe_count) || 0,
              complained: parseInt(campaign.statistics?.abuse_complaint_count) || 0
            };
            
            await supabase.from('email_campaigns_cache').upsert({
              campaign_uid: campaign.uid,
              account_id: account.id,
              name: campaign.name,
              subject: campaign.subject,
              status: campaign.status,
              created_at: campaign.created_at,
              updated_at: campaign.updated_at,
              delivery_date: campaign.delivery_at || campaign.run_at,
              run_at: campaign.run_at,
              last_error: campaign.last_error,
              delivery_info: deliveryInfo,
              cache_updated_at: new Date().toISOString()
            }, {
              onConflict: 'campaign_uid'
            });
          } catch (cacheError) {
            console.error(`Error caching campaign ${campaign.uid}:`, cacheError);
          }
        }
        
        console.log(`Successfully cached ${allCampaigns.length} campaigns for account ${account.name}`);
      }

      // Update last sync date in the account record
      await updateLastSyncDate(account.id);
      
      if (!quietMode) {
        toast.success(`Synchronisé ${allCampaigns.length} campagnes avec succès`, { id: "sync-campaigns" });
      }
      
      setLastSyncTime(new Date());
      result.success = true;
      result.campaignsCount = allCampaigns.length;
      return result;
    } catch (error: any) {
      console.error(`Campaign sync failed for account ${account.name}:`, error);
      result.error = error.message || 'Sync failed';
      if (!quietMode) {
        setSyncError(error.message || 'Sync failed');
        toast.error(`Échec de synchronisation: ${error.message || 'Erreur inconnue'}`, { id: "sync-campaigns" });
      }
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

  // Get cached campaigns count
  const getCachedCampaignsCount = async () => {
    try {
      const { count } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact' })
        .eq('account_id', account.id);
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching cached campaigns count:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (account?.id && account?.status === 'active') {
      // First check cached campaigns count
      getCachedCampaignsCount().then(count => {
        setCampaignsCount(count);
        // If cache is empty or forced sync interval, run sync
        if (count === 0) {
          syncCampaignsCache();
        }
      });

      // Set up the interval to run the sync periodically
      const intervalId = setInterval(() => syncCampaignsCache({ quietMode: true }), syncInterval);

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
    getDebugInfo,
    lastSyncTime,
    campaignsCount
  };
};
