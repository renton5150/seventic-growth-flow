
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";
import { useCampaignSync } from "./useCampaignSync";
import { fetchCampaignsFromCache } from "./useCampaignFetch";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const activeAccounts = useAcelleAccountsFilter(accounts);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { syncCampaignsCache } = useCampaignSync();

  const fetchCampaigns = async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    // Sync cache first
    const syncResult = await syncCampaignsCache();
    if (syncResult.error) {
      setSyncError(syncResult.error);
    }

    // Get campaigns from cache with a small delay to ensure sync has time to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchCampaignsFromCache(activeAccounts);
  };

  const { data: campaignsData = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: fetchCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    activeAccounts,
    campaignsData,
    isLoading,
    isError,
    error,
    syncError,
    refetch
  };
};
