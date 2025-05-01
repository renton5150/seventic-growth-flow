
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { useApiConnection } from './useApiConnection';
import { useCampaignCache } from './useCampaignCache';
import { useSyncOperation } from './useSyncOperation';

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

/**
 * Main hook for campaign synchronization that composes specialized hooks
 */
export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  const { 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    getDebugInfo, 
    debugInfo 
  } = useApiConnection(account);
  
  const { 
    campaignsCount, 
    getCachedCampaignsCount,
    clearAccountCache 
  } = useCampaignCache(account);
  
  const { 
    isSyncing, 
    syncError, 
    lastSyncTime,
    syncCampaignsCache 
  } = useSyncOperation(account);

  useEffect(() => {
    if (account?.id && account?.status === 'active') {
      // First check cached campaigns count
      getCachedCampaignsCount().then(count => {
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
    campaignsCount,
    clearAccountCache,
    debugInfo
  };
};
