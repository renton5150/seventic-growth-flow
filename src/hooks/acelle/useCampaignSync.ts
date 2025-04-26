
import { useCallback } from "react";
import { useWakeUpEdgeFunctions } from "./useWakeUpEdgeFunctions";
import { useCampaignSyncOperation } from "./useCampaignSyncOperation";
import { checkApiAvailability } from "./utils/apiAvailability";

export const useCampaignSync = () => {
  const { wakeUpEdgeFunctions, isWakingUp } = useWakeUpEdgeFunctions();
  const { syncCampaignsCache, isSyncing } = useCampaignSyncOperation();

  const checkAvailability = useCallback(async (retries = 2, retryDelay = 1500) => {
    return checkApiAvailability(retries, retryDelay);
  }, []);

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability: checkAvailability,
    isSyncing,
    isWakingUp
  };
};
