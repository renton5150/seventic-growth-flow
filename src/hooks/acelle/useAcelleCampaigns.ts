
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";
import { useCampaignSync } from "./useCampaignSync";
import { fetchCampaignsFromCache } from "./useCampaignFetch";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  console.log("useAcelleCampaigns appelé avec:", accounts);
  const activeAccounts = useAcelleAccountsFilter(accounts);
  console.log("Comptes actifs filtrés:", activeAccounts);
  
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { syncCampaignsCache, wakeUpEdgeFunctions } = useCampaignSync();

  // Ajout d'un effet pour tenter un réveil automatique au début
  useEffect(() => {
    const attemptInitialWakeUp = async () => {
      if (activeAccounts.length > 0) {
        console.log("Tentative automatique d'initialisation des edge functions...");
        try {
          await wakeUpEdgeFunctions();
          console.log("Réveil des edge functions réussi");
        } catch (err) {
          console.error("Échec du réveil des edge functions:", err);
        }
      }
    };
    
    attemptInitialWakeUp();
  }, [activeAccounts, wakeUpEdgeFunctions]);

  const fetchCampaigns = useCallback(async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    try {
      // Always try to wake up the edge functions first to ensure they're running
      console.log("Preemptively waking up edge functions");
      const wakeUpSuccess = await wakeUpEdgeFunctions().catch((err) => {
        console.error("Erreur lors du réveil des edge functions:", err);
        return false;
      });
      
      console.log("Statut du réveil des edge functions:", wakeUpSuccess ? "réussi" : "échec");
      
      // Try to get data from cache first
      const cachedCampaigns = await fetchCampaignsFromCache(activeAccounts);
      
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
        
        // If service is down, try one more explicit wake-up
        if (syncResult.error.includes("Failed to fetch") || 
            syncResult.error.includes("Request timed out")) {
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
      const freshCampaigns = await fetchCampaignsFromCache(activeAccounts);
      
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
    console.log("Manuel retry triggered");
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
