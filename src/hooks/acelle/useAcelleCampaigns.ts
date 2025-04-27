
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchCampaignsFromCache } from "./useCampaignFetch";
import { useCampaignSync } from "./useCampaignSync";
import { toast } from "sonner";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { syncAllCampaigns, wakeUpEdgeFunctions } = useCampaignSync();

  // Filter to only active accounts
  const activeAccounts = accounts.filter(acc => acc.status === "active");

  const fetchCampaigns = useCallback(async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    try {
      // Always try to wake up the edge functions first to ensure they're running
      console.log("Preemptively waking up edge functions");
      const wakeUpSuccess = await wakeUpEdgeFunctions().catch(() => false);
      
      // Try to get data from cache first
      const cachedCampaigns = await fetchCampaignsFromCache(activeAccounts);
      
      // If we have cache data, return it immediately but sync in background
      if (cachedCampaigns.length > 0) {
        console.log(`Returned ${cachedCampaigns.length} campaigns from cache`);
        
        // Sync in background without waiting for the result
        syncAllCampaigns().catch(err => {
          console.error("Background sync error:", err);
          setSyncError("Erreur de synchronisation en arrière-plan");
        });
        
        return cachedCampaigns;
      }
      
      // No cache data, try a full sync
      setIsInitializing(true);
      
      console.log("No cache data found, performing full synchronization");
      const syncResult = await syncAllCampaigns();
      
      if (!syncResult.success) {
        console.error("Sync failed");
        setSyncError("Échec de la synchronisation");
        
        // If service is down, try one more explicit wake-up
        console.log("Attempting explicit wake-up of edge functions");
        await wakeUpEdgeFunctions();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log("Retrying sync after wake-up attempt");
        const retryResult = await syncAllCampaigns();
        
        if (!retryResult.success) {
          throw new Error("Failed to sync after retry");
        }
      }
      
      // Wait a moment for the sync to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the freshly synced data
      const freshCampaigns = await fetchCampaignsFromCache(activeAccounts);
      
      if (freshCampaigns.length === 0) {
        console.log("No campaigns found after sync, might be empty account or sync issue");
      }
      
      return freshCampaigns;
    } catch (error) {
      console.error("Error in fetchCampaigns:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [activeAccounts, syncAllCampaigns, wakeUpEdgeFunctions]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const { data: campaignsData = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id), retryCount],
    queryFn: fetchCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000),
  });

  return {
    activeAccounts,
    campaignsData,
    isLoading: isLoading || isInitializing,
    isError,
    error,
    syncError,
    refetch,
    handleRetry
  };
};
