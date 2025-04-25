
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";
import { useCampaignSync } from "./useCampaignSync";
import { fetchCampaignsFromCache } from "./useCampaignFetch";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const activeAccounts = useAcelleAccountsFilter(accounts);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const { syncCampaignsCache, wakeUpEdgeFunctions } = useCampaignSync();

  const fetchCampaigns = async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    try {
      // Tenter de récupérer les données depuis le cache d'abord
      const cachedCampaigns = await fetchCampaignsFromCache(activeAccounts);
      
      // Si on obtient des résultats du cache, on les retourne immédiatement
      if (cachedCampaigns.length > 0) {
        console.log(`Returned ${cachedCampaigns.length} campaigns from cache`);
        // Sync en arrière-plan sans attendre le résultat
        syncCampaignsCache().catch(err => {
          console.error("Background sync error:", err);
          setSyncError("Erreur de synchronisation en arrière-plan");
        });
        return cachedCampaigns;
      }
      
      // Si pas de données en cache, tenter un réveil des services et une synchronisation complète
      setIsInitializing(true);
      
      // Réveiller les services d'abord
      await wakeUpEdgeFunctions();
      
      // Attendre un peu pour laisser les services démarrer
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Sync complet
      const syncResult = await syncCampaignsCache();
      if (syncResult.error) {
        setSyncError(syncResult.error);
        throw new Error(syncResult.error);
      }
      
      // Attendre un peu pour être sûr que la synchronisation a eu le temps de compléter
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Récupérer les données fraîchement synchronisées
      const freshCampaigns = await fetchCampaignsFromCache(activeAccounts);
      return freshCampaigns;
    } catch (error) {
      console.error("Error in fetchCampaigns:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const { data: campaignsData = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
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
    refetch
  };
};
