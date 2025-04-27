
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleAccountsFilter } from "./useAcelleAccountsFilter";
import { useCampaignSync } from "./useCampaignSync";
import { fetchCampaignsFromCache } from "./useCampaignFetch";
import { toast } from "sonner";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const activeAccounts = useAcelleAccountsFilter(accounts);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability,
    initializeServices
  } = useCampaignSync();
  const [autoRetryAttempts, setAutoRetryAttempts] = useState<number>(0);
  const initialCheckRef = useRef<boolean>(false);
  const initialCheckTimeoutRef = useRef<number | null>(null);

  // Ajouter une initialisation complète automatique au chargement
  useEffect(() => {
    const runInitialization = async () => {
      if (initialCheckRef.current || !activeAccounts.length) return;
      initialCheckRef.current = true;
      
      console.log("Initialisation automatique des services...");
      setIsInitializing(true);
      
      try {
        await initializeServices();
      } catch (err) {
        console.error("Erreur pendant l'initialisation automatique:", err);
        toast.error("Erreur d'initialisation automatique");
      } finally {
        setIsInitializing(false);
      }
    };
    
    runInitialization();
    
    return () => {
      if (initialCheckTimeoutRef.current) {
        clearTimeout(initialCheckTimeoutRef.current);
      }
    };
  }, [activeAccounts, initializeServices]);

  const fetchCampaigns = useCallback(async () => {
    console.log('Récupération des campagnes depuis le cache...');
    setSyncError(null);
    
    try {
      // Toujours essayer de réveiller les edge functions en premier
      // Mais ne pas attendre cette opération pour réduire le temps de chargement
      console.log("Réveil préventif des edge functions");
      wakeUpEdgeFunctions().catch(err => {
        console.error("Erreur lors du réveil des edge functions:", err);
      });
      
      if (activeAccounts.length === 0) {
        console.log("Aucun compte actif trouvé");
        return [];
      }

      // Essayer d'abord d'obtenir les données du cache - cela devrait être rapide
      let cachedCampaigns: AcelleCampaign[] = [];
      try {
        cachedCampaigns = await fetchCampaignsFromCache(activeAccounts);
        console.log(`Récupération de ${cachedCampaigns.length} campagnes depuis le cache`);
      } catch (err) {
        console.error("Erreur lors de la récupération depuis le cache:", err);
      }
      
      // Si nous avons des données en cache, les renvoyer immédiatement mais synchroniser en arrière-plan
      if (cachedCampaigns.length > 0) {
        console.log(`Renvoi de ${cachedCampaigns.length} campagnes depuis le cache`);
        
        // Synchronisation en arrière-plan sans attendre le résultat
        syncCampaignsCache().catch(err => {
          console.error("Erreur de synchronisation en arrière-plan:", err);
        });
        
        return cachedCampaigns;
      }
      
      // Pas de données en cache, faire une synchronisation complète
      setIsInitializing(true);
      
      console.log("Aucune donnée en cache trouvée, exécution d'une synchronisation complète");
      
      // Vérifier d'abord si l'API est disponible
      const apiStatus = await checkApiAvailability(2, 2000);
      
      if (!apiStatus.available) {
        console.log("API non disponible, tentative de réveil des services...");
        await wakeUpEdgeFunctions();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Vérifier à nouveau la disponibilité de l'API
        const retryApiStatus = await checkApiAvailability(1, 1000);
        
        if (!retryApiStatus.available) {
          setSyncError("Services en cours d'initialisation, veuillez réessayer");
          return [];
        }
      }
      
      const syncResult = await syncCampaignsCache();
      
      if (syncResult.error) {
        console.error("Erreur de synchronisation:", syncResult.error);
        setSyncError(syncResult.error);
        return [];
      }
      
      setSyncError(null);
      
      // Attendre un moment pour que la synchronisation se termine
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Obtenir les données fraîchement synchronisées
      let freshCampaigns: AcelleCampaign[] = [];
      try {
        freshCampaigns = await fetchCampaignsFromCache(activeAccounts);
        console.log("Campagnes fraîches après synchronisation:", freshCampaigns.length);
      } catch (err) {
        console.error("Erreur lors de la récupération des campagnes fraîches:", err);
      }
      
      return freshCampaigns;
    } catch (error) {
      console.error("Erreur dans fetchCampaigns:", error);
      setSyncError(error.message || "Erreur de connexion");
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [activeAccounts, syncCampaignsCache, wakeUpEdgeFunctions, checkApiAvailability]);

  const handleRetry = useCallback(() => {
    console.log("Nouvelle tentative initiée par l'utilisateur");
    setRetryCount(prev => prev + 1);
    toast.loading("Initialisation des services et actualisation...");
    initializeServices();
  }, [initializeServices]);

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
    handleRetry,
    initializeServices
  };
};
