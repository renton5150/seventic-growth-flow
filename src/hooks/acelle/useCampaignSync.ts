
/**
 * Placeholder hook for campaign synchronization
 * This hook was previously used for Acelle campaign sync operations
 */

export const useCampaignSync = () => {
  return {
    syncAllCampaigns: async () => {
      console.warn("syncAllCampaigns: Email campaign functionality has been removed");
      return { success: false };
    },
    syncCampaign: async () => {
      console.warn("syncCampaign: Email campaign functionality has been removed");
      return { success: false };
    },
    wakeUpEdgeFunctions: async () => {
      console.warn("wakeUpEdgeFunctions: Email campaign functionality has been removed");
      return false;
    },
    isSyncing: false,
    lastSyncResult: null,
    // Adding missing properties to fix type errors
    syncCampaignsCache: async () => {
      console.warn("syncCampaignsCache: Email campaign functionality has been removed");
      return { success: false };
    },
    checkApiAvailability: async () => {
      console.warn("checkApiAvailability: Email campaign functionality has been removed");
      return false;
    },
    initializeServices: async () => {
      console.warn("initializeServices: Email campaign functionality has been removed");
      return { success: false };
    }
  };
};
