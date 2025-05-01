import { useState, useEffect } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { getAcelleCampaigns } from "@/services/acelle/api/campaigns";
import { updateLastSyncDate } from "@/services/acelle/api/accounts";

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (account?.id && account?.status === 'active') {
      const syncCampaigns = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
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
        } catch (error: any) {
          console.error(`Campaign sync failed for account ${account.name}:`, error);
          setSyncError(error.message || 'Sync failed');
        } finally {
          setIsSyncing(false);
        }
      };

      // Run the sync immediately when the component mounts
      syncCampaigns();

      // Set up the interval to run the sync periodically
      const intervalId = setInterval(syncCampaigns, syncInterval);

      // Clean up the interval when the component unmounts or the account changes
      return () => clearInterval(intervalId);
    }
  }, [account, syncInterval]);

  return { isSyncing, syncError };
};
