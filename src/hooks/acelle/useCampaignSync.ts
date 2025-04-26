
import { useCallback, useState } from "react";
import { useWakeUpEdgeFunctions } from "./useWakeUpEdgeFunctions";
import { useCampaignSyncOperation } from "./useCampaignSyncOperation";
import { checkApiAvailability } from "./utils/apiAvailability";

export const useCampaignSync = () => {
  const { wakeUpEdgeFunctions, isWakingUp, wakeUpStatus } = useWakeUpEdgeFunctions();
  const { syncCampaignsCache, isSyncing } = useCampaignSyncOperation();
  const [lastApiCheck, setLastApiCheck] = useState<number>(0);

  // Throttle API availability checks to prevent flooding
  const checkAvailability = useCallback(async (retries = 2, retryDelay = 1500) => {
    const now = Date.now();
    
    // Throttle checks to no more than once every 5 seconds
    if (now - lastApiCheck < 5000 && lastApiCheck > 0) {
      console.log("API check throttled - too many consecutive checks");
      return { available: false, error: "Check throttled" };
    }
    
    setLastApiCheck(now);
    return checkApiAvailability(retries, retryDelay);
  }, [lastApiCheck]);

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability: checkAvailability,
    isSyncing,
    isWakingUp,
    wakeUpStatus
  };
};
