import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import { CampaignsTableHeader } from "./table/TableHeader";
import { CampaignsTablePagination } from "./table/TablePagination";
import {
  TableLoadingState,
  TableErrorState,
  EmptyState,
  InactiveAccountState
} from "./table/LoadingAndErrorStates";
import AcelleCampaignDetails from "./AcelleCampaignDetails";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { hasEmptyStatistics } from "@/services/acelle/api/stats/directStats";
import { callViaEdgeFunction, getCachedStatistics } from "@/services/acelle/acelle-service";
import { SyncProgressDialog } from "./SyncProgressDialog";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, message: "" });
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [backgroundRefreshInProgress, setBackgroundRefreshInProgress] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    checkCacheStatistics,
    lastRefreshTimestamp,
    isCacheBusy
  } = useCampaignCache(account);
  
  // Fonction améliorée pour récupérer les statistiques via edge function UNIQUEMENT
  const fetchCampaignStatistics = async (campaignId: string, accountId: string, forceRefresh = false) => {
    try {
      console.log(`[fetchCampaignStatistics] Via edge function pour ${campaignId}`);
      
      // Essayer d'abord via Edge Function
      const result = await callViaEdgeFunction(campaignId, accountId, forceRefresh);
      
      if (result && result.success) {
        console.log(`[fetchCampaignStatistics] Succès pour ${campaignId}`);
        return result;
      }
      
      // Fallback sur le cache en cas d'échec
      console.log(`[fetchCampaignStatistics] Fallback cache pour ${campaignId}`);
      const cachedStats = await getCachedStatistics(campaignId, accountId);
      
      if (cachedStats) {
        return {
          success: true,
          stats: cachedStats,
          source: 'cache'
        };
      }
      
      return null;
    } catch (error) {
      console.error(`[fetchCampaignStatistics] Erreur pour ${campaignId}:`, error);
      
      // Fallback sur le cache en cas d'exception
      try {
        const cachedStats = await getCachedStatistics(campaignId, accountId);
        if (cachedStats) {
          return {
            success: true,
            stats: cachedStats,
            source: 'cache'
          };
        }
      } catch (cacheError) {
        console.error(`[fetchCampaignStatistics] Erreur cache fallback:`, cacheError);
      }
      
      return null;
    }
  };
  
  // Fonction de rafraîchissement des données améliorée
  const refetch = useCallback(async (options?: { forceRefresh?: boolean }) => {
    const shouldForceRefresh = options?.forceRefresh === true;
    
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setConnectionStatus('checking');
    
    try {
      if (account?.id) {
        console.log(`[refetch] Récupération pour page ${currentPage}, force: ${shouldForceRefresh}`);
        
        // Récupérer les campagnes du cache
        const fetchedCampaigns = await fetchCampaignsFromCache(
          [account], 
          currentPage, 
          itemsPerPage
        );
        
        if (fetchedCampaigns.length > 0) {
          console.log(`[refetch] ${fetchedCampaigns.length} campagnes trouvées dans le cache`);
          setCampaigns(fetchedCampaigns);
          setConnectionStatus('ok');
          setIsLoading(false);
          
          // Enrichissement en arrière-plan si nécessaire
          const campaignsNeedingRefresh = fetchedCampaigns.filter(campaign => 
            !campaign.statistics || hasEmptyStatistics(campaign.statistics)
          );
          
          if (campaignsNeedingRefresh.length > 0 || shouldForceRefresh) {
            setBackgroundRefreshInProgress(true);
            
            setTimeout(async () => {
              try {
                const campaignsToRefresh = shouldForceRefresh ? fetchedCampaigns : campaignsNeedingRefresh;
                const updatedCampaigns = [...fetchedCampaigns];
                
                for (let i = 0; i < campaignsToRefresh.length; i++) {
                  try {
                    const campaign = campaignsToRefresh[i];
                    const campaignId = campaign.uid || campaign.campaign_uid;
                    
                    if (campaignId) {
                      const statsData = await fetchCampaignStatistics(campaignId, account.id, true);
                      if (statsData && statsData.success) {
                        const originalIndex = fetchedCampaigns.findIndex(c => 
                          (c.uid === campaign.uid) || (c.campaign_uid === campaign.campaign_uid)
                        );
                        
                        if (originalIndex !== -1) {
                          updatedCampaigns[originalIndex] = {
                            ...campaign,
                            statistics: statsData.stats
                          };
                        }
                      }
                    }
                  } catch (err) {
                    console.error(`[refetch] Erreur enrichissement ${campaignsToRefresh[i].name}:`, err);
                  }
                }
                
                setCampaigns(updatedCampaigns);
                setConnectionStatus('ok');
                console.log(`[refetch] Enrichissement terminé`);
              } catch (err) {
                console.error("[refetch] Erreur enrichissement:", err);
                setConnectionStatus('error');
              } finally {
                setBackgroundRefreshInProgress(false);
              }
            }, 100);
          }
        } else {
          console.log("[refetch] Aucune campagne dans le cache");
          setCampaigns([]);
          setConnectionStatus('error');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("[refetch] Erreur:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Échec de récupération"));
      setConnectionStatus('error');
      setIsLoading(false);
    }
  }, [account, currentPage, itemsPerPage]);

  // Obtenir le token d'authentification
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          setAccessToken(token);
        } else {
          console.error("Token d'authentification manquant");
          toast.error("Erreur d'authentification");
        }
      } catch (error) {
        console.error("Erreur récupération token:", error);
        toast.error("Erreur d'authentification");
      }
    };
    
    getAuthToken();
  }, []);
  
  // Charger les campagnes au montage et aux changements
  useEffect(() => {
    refetch({ forceRefresh: false });
  }, [refetch, currentPage, account]);

  // Calcul pagination
  useEffect(() => {
    const calculateTotalPages = async () => {
      try {
        if (!account?.id) {
          setTotalPages(0);
          return;
        }

        const { data, error } = await supabase
          .from('email_campaigns_cache')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', account.id);
          
        if (error) {
          console.error("Erreur comptage:", error);
          return;
        }
        
        const count = data?.length || campaignsCount || 0;
        const pages = Math.ceil(count / itemsPerPage);
        setTotalPages(pages);
        setHasNextPage(currentPage < pages);
      } catch (err) {
        console.error("Erreur calcul pagination:", err);
      }
    };
    
    calculateTotalPages();
  }, [account?.id, campaignsCount, currentPage, itemsPerPage]);

  // Rafraîchissement manuel
  const handleRefresh = useCallback(async () => {
    setIsManuallyRefreshing(true);
    setConnectionError(null);
    
    try {
      await refetch({ forceRefresh: true });
      toast.success("Données rafraîchies", { id: "refresh" });
    } catch (err) {
      console.error("Erreur rafraîchissement:", err);
      toast.error("Erreur de rafraîchissement", { id: "refresh" });
      setConnectionError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [refetch]);

  // Synchronisation complète avec progression
  const handleFullSync = useCallback(async () => {
    if (!accessToken || !account) {
      toast.error("Token ou compte manquant", { id: "full-sync" });
      return;
    }
    
    setIsFullSyncing(true);
    setSyncProgress({ current: 0, total: 0, message: "Démarrage de la synchronisation complète..." });
    
    try {
      const result = await forceSyncCampaigns(account, accessToken, (progress) => {
        setSyncProgress(progress);
      });
      
      if (result.success) {
        toast.success(`${result.totalCampaigns || 0} campagnes synchronisées !`, { id: "full-sync" });
        await refetch({ forceRefresh: false });
      } else {
        toast.error(result.message, { id: "full-sync" });
      }
    } catch (err) {
      console.error("Erreur synchronisation complète:", err);
      toast.error("Erreur de synchronisation complète", { id: "full-sync" });
    } finally {
      setIsFullSyncing(false);
      setSyncProgress({ current: 0, total: 0, message: "" });
    }
  }, [accessToken, account, refetch]);

  // Synchronisation manuelle (rapide)
  const handleSync = useCallback(async () => {
    if (!accessToken || !account) {
      toast.error("Token ou compte manquant", { id: "sync" });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      toast.loading("Synchronisation rapide...", { id: "sync" });
      const result = await forceSyncCampaigns(account, accessToken);
      
      if (result.success) {
        toast.success(result.message, { id: "sync" });
        await refetch({ forceRefresh: false });
      } else {
        toast.error(result.message, { id: "sync" });
      }
    } catch (err) {
      console.error("Erreur synchronisation:", err);
      toast.error("Erreur de synchronisation", { id: "sync" });
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, account, refetch]);

  // Traitement des campagnes filtrées
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredCampaigns
  } = useAcelleCampaignsTable(campaigns || []);

  const handleViewCampaign = (uid: string) => {
    setSelectedCampaign(uid);
  };

  const handleCloseDetails = () => {
    setSelectedCampaign(null);
  };
  
  const handlePageChange = (page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    setCurrentPage(page);
  };

  // Indicateur de statut de connexion
  const ConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Vérification connexion...
          </div>
        );
      case 'ok':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            Connexion OK
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-3 w-3" />
            Problème de connexion
          </div>
        );
      default:
        return null;
    }
  };

  // Si le compte est inactif
  if (account?.status !== 'active') {
    return <InactiveAccountState />;
  }

  // États d'affichage
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (isError) {
    return (
      <TableErrorState 
        error={error instanceof Error ? error.message : "Une erreur est survenue"} 
        onRetry={() => refetch({ forceRefresh: false })}
        retryCount={0}
      />
    );
  }

  if (!filteredCampaigns?.length) {
    return <EmptyState onSync={handleSync} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <AcelleTableFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <div className="flex flex-wrap gap-2 items-center">
          <ConnectionStatusIndicator />
          
          {backgroundRefreshInProgress && (
            <div className="text-sm text-muted-foreground flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Actualisation...
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {campaignsCount} campagnes en cache
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManuallyRefreshing || backgroundRefreshInProgress || isFullSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !accessToken || backgroundRefreshInProgress || isFullSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Sync rapide
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleFullSync}
            disabled={isFullSyncing || !accessToken || backgroundRefreshInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFullSyncing ? "animate-spin" : ""}`} />
            Sync complète
          </Button>
        </div>
      </div>
      
      {connectionError && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p>{connectionError}</p>
          </CardContent>
        </Card>
      )}
      
      {lastRefreshTimestamp && (
        <div className="text-xs text-muted-foreground mb-2">
          Dernière synchronisation: {new Date(lastRefreshTimestamp).toLocaleString()}
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <CampaignsTableHeader 
                columns={[
                  { key: "name", label: "Nom" },
                  { key: "subject", label: "Sujet" },
                  { key: "status", label: "Statut" },
                  { key: "delivery_date", label: "Date d'envoi" },
                  { key: "subscriber_count", label: "Destinataires" },
                  { key: "open_rate", label: "Taux d'ouverture" },
                  { key: "click_rate", label: "Taux de clic" },
                  { key: "bounce_count", label: "Bounces" },
                  { key: "", label: "" }
                ]}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(column) => {
                  if (sortBy === column) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(column);
                    setSortOrder("desc");
                  }
                }}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <AcelleTableRow 
                key={campaign.uid || campaign.campaign_uid} 
                campaign={campaign} 
                account={account}
                onViewCampaign={handleViewCampaign}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <CampaignsTablePagination 
          currentPage={currentPage}
          onPageChange={handlePageChange}
          hasNextPage={hasNextPage}
          totalPages={totalPages}
        />
      </div>

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => {
        if (!open) handleCloseDetails();
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCampaign && "Détails de la campagne"}
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <AcelleCampaignDetails 
              campaignId={selectedCampaign} 
              account={account} 
              onClose={handleCloseDetails}
            />
          )}
        </DialogContent>
      </Dialog>

      <SyncProgressDialog 
        isOpen={isFullSyncing}
        progress={syncProgress}
      />
    </div>
  );
}
