
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle";
import { useCampaignSync } from "./useCampaignSync";
import { useCampaignFetch } from "./useCampaignFetch";

export const useAcelleCampaigns = (accounts: AcelleAccount[] = []) => {
  const [syncError, setSyncError] = useState<string>("");
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [filter, setFilter] = useState<string>("");

  const { 
    syncAllCampaigns, 
    syncCampaign,
    wakeUpEdgeFunctions,
    isSyncing, 
    lastSyncResult 
  } = useCampaignSync();

  // Filter accounts to only active accounts
  useEffect(() => {
    setActiveAccounts(accounts.filter(account => account.status === "active"));
  }, [accounts]);

  // Function to fetch campaigns from all active accounts
  const fetchAllCampaigns = useCallback(async () => {
    try {
      if (!activeAccounts.length) {
        return [];
      }

      setSyncError("");
      const { fetchCampaigns } = useCampaignFetch();
      
      // Fetch campaigns from each account in parallel
      const promises = activeAccounts.map(account => fetchCampaigns(account));
      const results = await Promise.all(promises);

      // Combine all campaign arrays
      const allCampaigns = results.flat();
      return allCampaigns;
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setSyncError(error instanceof Error ? error.message : "Une erreur s'est produite lors du chargement des campagnes");
      return [];
    }
  }, [activeAccounts]);

  // Query to fetch all campaigns
  const { 
    data: campaignsData = [], 
    isLoading, 
    isError,
    error,
    refetch,
  } = useQuery<AcelleCampaign[]>({
    queryKey: ["acelleCampaigns", activeAccounts.map(a => a.id)],
    queryFn: fetchAllCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update campaigns state when campaignsData changes
  useEffect(() => {
    setCampaigns(campaignsData);
  }, [campaignsData]);

  // Retry logic with edge function initialization
  const handleRetry = useCallback(async () => {
    try {
      setSyncError("");
      toast.loading("Vérification de la disponibilité des services...");
      
      // Try to wake up edge functions first
      const awake = await wakeUpEdgeFunctions();
      
      if (awake) {
        toast.success("Services disponibles, chargement des données...");
        await refetch();
      } else {
        setSyncError("Les services semblent inaccessibles. Veuillez réessayer dans quelques instants.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setSyncError(error.message);
      } else {
        setSyncError("Erreur lors de la reconnexion");
      }
    }
  }, [wakeUpEdgeFunctions, refetch]);

  // Filter accounts based on search
  const filteredAccounts = {
    filter,
    setFilter,
    filteredAccounts: activeAccounts.filter(account => 
      filter === "" || account.name.toLowerCase().includes(filter.toLowerCase())
    )
  };

  return { 
    campaigns: campaignsData, 
    campaignsData,
    isLoading, 
    isError,
    error,
    syncError,
    activeAccounts,
    accountsFilter: filteredAccounts,
    refetch,
    handleRetry
  };
};
