
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";
import { useCampaignSync } from "./useCampaignSync";
import { fetchCampaignsFromCache } from "./useCampaignFetch";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const activeAccounts = useAcelleAccountsFilter(accounts);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { syncCampaignsCache, wakeUpEdgeFunctions, checkApiAvailability } = useCampaignSync();
  const [autoRetryAttempts, setAutoRetryAttempts] = useState<number>(0);

  // Add initial check when component mounts
  useEffect(() => {
    const initialCheck = async () => {
      try {
        const apiStatus = await checkApiAvailability(2, 2000);
        console.log("Initial API availability check:", apiStatus);
        
        if (!apiStatus.available) {
          console.log("API not initially available, attempting to wake up services...");
          await wakeUpEdgeFunctions();
          
          // Programmer une tentative automatique de synchronisation après l'initialisation
          setTimeout(() => {
            if (autoRetryAttempts < 2) {
              console.log("Auto-retry after wake up");
              setRetryCount(prev => prev + 1);
              setAutoRetryAttempts(prev => prev + 1);
            }
          }, 5000);
        }
      } catch (err) {
        console.error("Error during initial API check:", err);
      }
    };
    
    if (activeAccounts.length > 0) {
      initialCheck();
    }
  }, [activeAccounts, wakeUpEdgeFunctions, checkApiAvailability, autoRetryAttempts]);

  const fetchCampaigns = useCallback(async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    try {
      // Always try to wake up the edge functions first to ensure they're running
      console.log("Preemptively waking up edge functions");
      const wakeUpSuccess = await wakeUpEdgeFunctions().catch(err => {
        console.error("Error during edge functions wake-up:", err);
        return false;
      });
      
      // Si le wakeUpEdgeFunctions échoue, attendre un peu avant de poursuivre
      if (!wakeUpSuccess) {
        await new Promise(r => setTimeout(r, 3000));
      }
      
      // Try to get data from cache first
      const cachedCampaigns = await fetchCampaignsFromCache(activeAccounts)
        .catch(err => {
          console.error("Error fetching from cache:", err);
          return [];
        });
      
      // If we have cache data, return it immediately but sync in background
      if (cachedCampaigns.length > 0) {
        console.log(`Returned ${cachedCampaigns.length} campaigns from cache`);
        
        // Sync in background without waiting for the result
        syncCampaignsCache().catch(err => {
          console.error("Background sync error:", err);
          setSyncError("Erreur de synchronisation en arrière-plan");
        });
        
        return cachedCampaigns;
      }
      
      // No cache data, try a full sync
      setIsInitializing(true);
      
      console.log("No cache data found, performing full synchronization");
      const syncResult = await syncCampaignsCache();
      
      if (syncResult.error) {
        console.error("Sync error:", syncResult.error);
        setSyncError(syncResult.error);
        
        // If service is down, try explicit wake-up
        if (syncResult.error.includes("Failed to fetch") || 
            syncResult.error.includes("Request timed out") ||
            syncResult.error.includes("unavailable")) {
          console.log("Attempting explicit wake-up of edge functions");
          await wakeUpEdgeFunctions();
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log("Retrying sync after wake-up attempt");
          const retryResult = await syncCampaignsCache();
          
          if (retryResult.error) {
            throw new Error(retryResult.error);
          }
        } else {
          throw new Error(syncResult.error);
        }
      }
      
      // Wait a moment for the sync to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the freshly synced data
      const freshCampaigns = await fetchCampaignsFromCache(activeAccounts)
        .catch(err => {
          console.error("Error fetching fresh campaigns:", err);
          return [];
        });
      console.log("Fresh campaigns after sync:", freshCampaigns.length);
      
      if (freshCampaigns.length === 0) {
        console.log("No campaigns found after sync, might be empty account or sync issue");
        // This is not necessarily an error - the account might genuinely have no campaigns
      }
      
      return freshCampaigns;
    } catch (error) {
      console.error("Error in fetchCampaigns:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [activeAccounts, syncCampaignsCache, wakeUpEdgeFunctions]);

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
