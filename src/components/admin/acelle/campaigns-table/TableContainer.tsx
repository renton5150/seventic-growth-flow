
import React, { useState, useEffect, useCallback } from "react";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { useCampaignSync } from "@/hooks/acelle/useCampaignSync";
import { useCampaignStatsCache } from "@/hooks/acelle/useCampaignStatsCache";
import { TableHeader } from "./TableHeader";
import { TableContent } from "./TableContent";
import { TableFooter } from "./TableFooter";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";
import { generateDemoCampaigns } from "./utils/demoData";
import { ErrorState } from "./states/ErrorState";
import { InactiveAccountState } from "../table/LoadingAndErrorStates";

interface TableContainerProps {
  account: AcelleAccount;
  onDemoMode?: (isDemoMode: boolean) => void;
}

export function TableContainer({ account, onDemoMode }: TableContainerProps) {
  // État local pour la pagination, la sélection et les erreurs
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Limité à 5 campagnes par page
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsLoadedCount, setStatsLoadedCount] = useState(0);
  
  // Utiliser notre hook de cache de statistiques
  const { 
    cacheStats, 
    getStatsFromCache,
    cacheInfo 
  } = useCampaignStatsCache();
  
  // Utiliser notre hook de synchronisation avec une période de 5 minutes
  const { 
    isSyncing, 
    syncError, 
    lastSyncTime, 
    forceSyncNow,
    campaignsCount,
  } = useCampaignSync({
    account,
    syncInterval: 5 * 60 * 1000 // 5 minutes
  });
  
  // Create a refetch function to reload the campaigns
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      if (demoMode) {
        // Generate demo campaigns
        const demoCampaigns = generateDemoCampaigns(currentPage, itemsPerPage);
        setCampaigns(demoCampaigns);
      } else if (account?.id) {
        // Fetch campaigns from cache
        const fetchedCampaigns = await fetchCampaignsFromCache(
          [account], 
          currentPage, 
          itemsPerPage
        );
        
        // Enrichir les campagnes avec les statistiques en cache si disponibles
        const enrichedCampaigns = fetchedCampaigns.map(campaign => {
          const campaignUid = campaign.uid || campaign.campaign_uid;
          if (!campaignUid) return campaign;
          
          const cachedStats = getStatsFromCache(campaignUid);
          if (cachedStats) {
            console.log(`[Table] Statistiques trouvées en cache pour ${campaign.name}`);
            campaign.statistics = cachedStats;
          }
          
          return campaign;
        });
        
        setCampaigns(enrichedCampaigns);
        setStatsLoadedCount(enrichedCampaigns.filter(c => c.statistics).length);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch campaigns"));
    } finally {
      setIsLoading(false);
    }
  }, [account, currentPage, demoMode, itemsPerPage, getStatsFromCache]);
  
  // Fetch campaigns when page changes or account changes
  useEffect(() => {
    refetch();
  }, [refetch, currentPage, account, campaignsCount]);

  // Calcul du nombre total de pages en fonction du nombre total de campagnes
  useEffect(() => {
    const calculateTotalPages = async () => {
      try {
        if (demoMode) {
          // En mode démo, on suppose qu'il y a 20 campagnes (4 pages)
          setTotalPages(4);
          return;
        }

        if (!account?.id) {
          setTotalPages(0);
          return;
        }

        // Obtenir le nombre total de campagnes en cache pour ce compte
        const { data, error } = await supabase
          .from('email_campaigns_cache')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', account.id);
          
        if (error) {
          console.error("Erreur lors du comptage des campagnes:", error);
          return;
        }
        
        const count = data?.length || campaignsCount || 0;
        const pages = Math.ceil(count / itemsPerPage);
        setTotalPages(pages);
        setHasNextPage(currentPage < pages);
        
        console.log(`Pagination: ${count} campagnes trouvées, ${pages} pages disponibles`);
      } catch (err) {
        console.error("Erreur lors du calcul du nombre de pages:", err);
      }
    };
    
    calculateTotalPages();
  }, [account?.id, campaignsCount, currentPage, demoMode, itemsPerPage]);

  // Activer ou désactiver le mode démo
  const enableDemoMode = useCallback((enable: boolean) => {
    setDemoMode(enable);
    if (onDemoMode) {
      onDemoMode(enable);
    }
    
    if (enable) {
      toast.info("Mode démo activé: les données affichées sont fictives", {
        id: "demo-mode",
        duration: 5000
      });
    } else {
      toast.info("Mode démo désactivé: affichage des données réelles", {
        id: "demo-mode",
        duration: 5000
      });
    }
  }, [onDemoMode]);

  // Rafraîchir manuellement les campagnes
  const handleRefresh = useCallback(async () => {
    setIsManuallyRefreshing(true);
    setConnectionError(null);
    
    try {
      await refetch();
      toast.success("Les données ont été rafraîchies", { id: "refresh" });
    } catch (err) {
      console.error("Erreur lors du rafraîchissement:", err);
      toast.error("Erreur lors du rafraîchissement des données", { id: "refresh" });
      setConnectionError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [refetch]);

  // Synchroniser manuellement les campagnes
  const handleSync = useCallback(async () => {
    try {
      await forceSyncNow();
      await refetch();
    } catch (err) {
      console.error("Erreur lors de la synchronisation manuelle:", err);
      toast.error("Erreur lors de la synchronisation", { id: "sync" });
    }
  }, [forceSyncNow, refetch]);

  // Gérer le chargement par lots complété
  const handleBatchLoadComplete = useCallback((statsMap: Map<string, AcelleCampaignStatistics>) => {
    console.log(`[Table] Chargement par lots terminé: ${statsMap.size} statistiques chargées`);
    setStatsLoadedCount(prev => prev + statsMap.size);
    setLoadingStats(false);
    
    // Mettre à jour les campagnes avec les nouvelles statistiques
    setCampaigns(prevCampaigns => {
      return prevCampaigns.map(campaign => {
        const uid = campaign.uid || campaign.campaign_uid;
        if (!uid) return campaign;
        
        const stats = statsMap.get(uid);
        if (stats) {
          return {
            ...campaign,
            statistics: stats
          };
        }
        
        return campaign;
      });
    });
  }, []);

  // Gérer le chargement d'une statistique individuelle
  const handleStatLoaded = useCallback((campaignUid: string, stats: AcelleCampaignStatistics) => {
    setStatsLoadedCount(prev => prev + 1);
  }, []);

  // Afficher la campagne sélectionnée
  const handleViewCampaign = (uid: string) => {
    console.log(`Affichage des détails pour la campagne ${uid}`);
    setSelectedCampaign(uid);
  };

  // Fermer la vue détaillée
  const handleCloseDetails = () => {
    setSelectedCampaign(null);
  };
  
  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    
    setCurrentPage(page);
    // Réinitialiser le compteur de statistiques chargées
    setStatsLoadedCount(0);
    console.log(`Changement de page: ${page}`);
  };

  // Initialiser le chargement des statistiques
  useEffect(() => {
    if (campaigns.length > 0 && !demoMode) {
      setLoadingStats(true);
      console.log(`[Table] Initialisation du chargement des statistiques pour ${campaigns.length} campagnes`);
    }
  }, [campaigns, demoMode]);

  // Si le compte est inactif
  if (account?.status !== 'active' && !demoMode) {
    return <InactiveAccountState />;
  }

  // États d'erreur ou de chargement sont maintenant dans un composant séparé
  if (isError || isLoading) {
    return (
      <ErrorState 
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error.message : "Une erreur est survenue"}
        onRetry={() => {
          setRetryCount((prev) => prev + 1);
          refetch();
        }}
        retryCount={retryCount}
        demoMode={demoMode}
      />
    );
  }

  return (
    <div className="space-y-4">
      <TableHeader 
        onRefresh={handleRefresh} 
        onSync={handleSync}
        toggleDemoMode={enableDemoMode}
        demoMode={demoMode}
        isRefreshing={isManuallyRefreshing}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        cacheInfo={cacheInfo}
        connectionError={connectionError}
        syncError={syncError}
      />

      <TableContent 
        campaigns={campaigns}
        account={account}
        onViewCampaign={handleViewCampaign}
        demoMode={demoMode}
        onStatLoaded={handleStatLoaded}
        onBatchLoadComplete={handleBatchLoadComplete}
        loadingStats={loadingStats}
        statsLoadedCount={statsLoadedCount}
      />

      <TableFooter 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        hasNextPage={hasNextPage}
        totalPages={totalPages}
      />

      <CampaignDetailsDialog
        selectedCampaign={selectedCampaign}
        account={account}
        onClose={handleCloseDetails}
        demoMode={demoMode}
      />
    </div>
  );
}
