
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { fetchCampaignsFromCache } from "./useCampaignFetch";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";

interface UseCampaignSync {
  syncAllCampaigns: () => Promise<{ success: boolean }>;
  syncCampaign: () => Promise<{ success: boolean }>;
  wakeUpEdgeFunctions: () => Promise<boolean>;
  isSyncing: boolean;
  lastSyncResult: any;
}

export const useCampaignSync = (): UseCampaignSync => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const syncAllCampaigns = async (): Promise<{ success: boolean }> => {
    try {
      setIsSyncing(true);
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSyncResult({ success: true });
      return { success: true };
    } catch (error) {
      console.error("Error syncing campaigns:", error);
      setLastSyncResult({ success: false, error });
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCampaign = async (): Promise<{ success: boolean }> => {
    // Mock implementation
    return { success: true };
  };

  const wakeUpEdgeFunctions = async (): Promise<boolean> => {
    // Mock implementation
    return true;
  };

  return {
    syncAllCampaigns,
    syncCampaign,
    wakeUpEdgeFunctions,
    isSyncing,
    lastSyncResult
  };
};

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const accountsFilter = useAcelleAccountsFilter(accounts);
  const activeAccounts = accounts.filter(account => account.status === "active");
  const activeAccountIds = activeAccounts.map(account => account.id);
  
  const { syncAllCampaigns, isSyncing } = useCampaignSync();
  
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const result = await acelleService.checkApiAvailability();
      return result.available;
    } catch (error) {
      return false;
    }
  }, []);
  
  const fetchAndCombineCampaigns = useCallback(async () => {
    if (accountsFilter.filteredAccounts.length === 0) {
      setCampaigns([]);
      return;
    }
    
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      setSyncError(null);
      
      // Wait until the API is available
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        throw new Error("API unavailable");
      }
      
      // Get campaigns from cache
      const cachedCampaigns = await fetchCampaignsFromCache(activeAccountIds);
      setCampaigns(cachedCampaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch campaigns"));
      setSyncError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [activeAccountIds, accountsFilter.filteredAccounts.length, checkAvailability]);
  
  useEffect(() => {
    fetchAndCombineCampaigns();
  }, [fetchAndCombineCampaigns]);
  
  const handleRetry = useCallback(async () => {
    try {
      setSyncError("Tentative de connexion...");
      
      // Check if services are available
      const isAvailable = await checkAvailability();
      
      if (!isAvailable) {
        // Try to wake up services
        const awoken = await syncAllCampaigns();
        if (!awoken.success) {
          setSyncError(`Les services sont indisponibles: ${awoken.success === false ? "Une erreur interne s'est produite" : "Unknown error"}`);
          return;
        }
      }
      
      // Try to fetch campaigns
      await fetchAndCombineCampaigns();
      toast.success("Connexion établie aux services Acelle.");
    } catch (error) {
      console.error("Error during retry:", error);
      setSyncError(`Échec de la connexion: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [checkAvailability, fetchAndCombineCampaigns, syncAllCampaigns]);
  
  return {
    campaigns,
    isLoading: isLoading || isSyncing,
    isError,
    error,
    syncError,
    activeAccounts,
    accountsFilter,
    refetch: fetchAndCombineCampaigns,
    handleRetry
  };
};
