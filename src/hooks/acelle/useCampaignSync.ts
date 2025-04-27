
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
    lastSyncResult: null
  };
};
