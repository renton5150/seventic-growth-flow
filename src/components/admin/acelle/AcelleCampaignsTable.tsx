// Mise à jour du composant AcelleCampaignsTable pour retirer le mode démo
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
import { acelleService } from "@/services/acelle";
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
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { hasEmptyStatistics } from "@/services/acelle/api/stats/directStats";
import { ACELLE_DEV_MODE } from "@/utils/acelle/config";
import { mockCampaignStatisticsResponse, generateFakeCampaigns, withDeveloperFallback } from "@/utils/acelle/developerMode";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Limité à 5 campagnes par page
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [backgroundRefreshInProgress, setBackgroundRefreshInProgress] = useState(false);
  
  // Utiliser notre hook useCampaignCache pour les opérations de cache
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    checkCacheStatistics,
    lastRefreshTimestamp,
    isCacheBusy
  } = useCampaignCache(account);
  
  // Fonction modifiée pour récupérer les statistiques d'une campagne via la fonction Edge
  // avec support du mode développeur
  const fetchCampaignStatistics = async (campaignId: string, accountId: string, forceRefresh = false) => {
    // En mode développeur, utiliser les données factices
    if (ACELLE_DEV_MODE) {
      console.log(`[DEV MODE] Génération de statistiques factices pour la campagne ${campaignId}`);
      return withDeveloperFallback(
        () => Promise.reject(new Error("Mode développeur activé")),
        mockCampaignStatisticsResponse(campaignId)
      );
    }
    
    // En mode production, utiliser l'API réelle
    try {
      const supabaseUrl = "https://dupguifqyjchlmzbadav.supabase.co";
      const functionUrl = `${supabaseUrl}/functions/v1/acelle-stats-test?campaignId=${campaignId}&accountId=${accountId}&forceRefresh=${forceRefresh}`;
      
      console.log(`Récupération des statistiques pour la campagne ${campaignId} via Edge function`);
      
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status} lors de la récupération des statistiques:`, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Statistiques récupérées avec succès pour la campagne ${campaignId}:`, data);
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques pour ${campaignId}:`, error);
      throw error;
    }
  };
  
  // Create a refetch function to reload the campaigns
  const refetch = useCallback(async (options?: { forceRefresh?: boolean }) => {
    const shouldForceRefresh = options?.forceRefresh === true;
    
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      if (account?.id) {
        // En mode développeur, générer des données factices
        if (ACELLE_DEV_MODE) {
          console.log("[DEV MODE] Génération de campagnes factices");
          const fakeCampaigns = generateFakeCampaigns(Math.floor(Math.random() * 15) + 5); // 5 à 20 campagnes
          setCampaigns(fakeCampaigns);
          setIsLoading(false);
          return;
        }
        
        // En mode production, fetch campaigns from cache
        console.log(`Fetching campaigns from cache for page ${currentPage}, forcing refresh: ${shouldForceRefresh}`);
        const fetchedCampaigns = await fetchCampaignsFromCache(
          [account], 
          currentPage, 
          itemsPerPage
        );
        
        // Si nous avons des campagnes en cache, les afficher immédiatement
        if (fetchedCampaigns.length > 0) {
          console.log(`Displaying ${fetchedCampaigns.length} cached campaigns immediately`);
          setCampaigns(fetchedCampaigns);
          setIsLoading(false);
          
          // Vérifier quelles campagnes ont des statistiques vides et nécessitent un rafraîchissement
          const campaignsNeedingRefresh = fetchedCampaigns.filter(campaign => 
            !campaign.statistics || hasEmptyStatistics(campaign.statistics)
          );
          
          // Si certaines campagnes ont besoin d'un rafraîchissement ou si un rafraîchissement complet est demandé
          if (campaignsNeedingRefresh.length > 0 || shouldForceRefresh) {
            setBackgroundRefreshInProgress(true);
            
            if (campaignsNeedingRefresh.length > 0) {
              console.log(`Starting background refresh for ${campaignsNeedingRefresh.length} campaigns with empty statistics`);
            } else {
              console.log("Starting background refresh of all campaign statistics");
            }
            
            // Ceci s'exécutera en arrière-plan sans bloquer l'interface
            setTimeout(async () => {
              try {
                // Si nous avons des campagnes spécifiques à rafraîchir et qu'un rafraîchissement complet n'est pas demandé
                if (campaignsNeedingRefresh.length > 0 && !shouldForceRefresh) {
                  // Pour chaque campagne nécessitant un rafraîchissement
                  const refreshedCampaigns = [];
                  
                  for (const campaign of campaignsNeedingRefresh) {
                    try {
                      const campaignId = campaign.uid || campaign.campaign_uid;
                      if (campaignId) {
                        const statsData = await fetchCampaignStatistics(campaignId, account.id, true);
                        if (statsData && statsData.success) {
                          refreshedCampaigns.push({
                            ...campaign,
                            statistics: statsData.stats
                          });
                        }
                      }
                    } catch (err) {
                      console.error(`Erreur lors du rafraîchissement de la campagne ${campaign.name}:`, err);
                    }
                  }
                  
                  // Mettre à jour uniquement les campagnes qui ont été rafraîchies
                  if (refreshedCampaigns.length > 0) {
                    const updatedCampaigns = fetchedCampaigns.map(campaign => {
                      const refreshed = refreshedCampaigns.find(c => 
                        c.uid === campaign.uid || c.campaign_uid === campaign.campaign_uid
                      );
                      return refreshed || campaign;
                    });
                    
                    setCampaigns(updatedCampaigns);
                    console.log(`Updated ${refreshedCampaigns.length} campaigns with fresh statistics`);
                  }
                } else {
                  // Rafraîchir toutes les campagnes si demandé
                  const updatedCampaigns = [...fetchedCampaigns];
                  
                  for (let i = 0; i < fetchedCampaigns.length; i++) {
                    try {
                      const campaign = fetchedCampaigns[i];
                      const campaignId = campaign.uid || campaign.campaign_uid;
                      
                      if (campaignId) {
                        const statsData = await fetchCampaignStatistics(campaignId, account.id, true);
                        if (statsData && statsData.success) {
                          updatedCampaigns[i] = {
                            ...campaign,
                            statistics: statsData.stats
                          };
                        }
                      }
                    } catch (err) {
                      console.error(`Erreur lors du rafraîchissement de la campagne ${fetchedCampaigns[i].name}:`, err);
                    }
                  }
                  
                  setCampaigns(updatedCampaigns);
                  console.log("Background refresh of all campaigns completed successfully");
                }
              } catch (err) {
                console.error("Error during background refresh:", err);
              } finally {
                setBackgroundRefreshInProgress(false);
              }
            }, 100);
          }
        } else {
          // Si le cache est vide, nous devons attendre l'enrichissement
          console.log("No campaigns in cache, waiting for enrichment...");
          
          const fetchedCampaignsList = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
          setCampaigns(fetchedCampaignsList);
          setIsLoading(false);
          
          // Lancer automatiquement la récupération des statistiques pour les campagnes
          setBackgroundRefreshInProgress(true);
          
          setTimeout(async () => {
            try {
              const updatedCampaigns = [...fetchedCampaignsList];
              
              for (let i = 0; i < fetchedCampaignsList.length; i++) {
                try {
                  const campaign = fetchedCampaignsList[i];
                  const campaignId = campaign.uid || campaign.campaign_uid;
                  
                  if (campaignId) {
                    const statsData = await fetchCampaignStatistics(campaignId, account.id, true);
                    if (statsData && statsData.success) {
                      updatedCampaigns[i] = {
                        ...campaign,
                        statistics: statsData.stats
                      };
                    }
                  }
                } catch (err) {
                  console.error(`Erreur lors de l'enrichissement de la campagne ${fetchedCampaignsList[i].name}:`, err);
                }
              }
              
              setCampaigns(updatedCampaigns);
              console.log("Initial statistics enrichment completed");
            } catch (err) {
              console.error("Error during initial statistics enrichment:", err);
            } finally {
              setBackgroundRefreshInProgress(false);
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch campaigns"));
      setIsLoading(false);
    }
  }, [account, currentPage, itemsPerPage]);

  // Obtenir le token d'authentification dès le montage du composant
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        console.log("Récupération du token d'authentification pour les requêtes API");
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Token d'authentification récupéré avec succès");
          setAccessToken(token);
        } else {
          console.error("Aucun token d'authentification disponible dans la session");
          toast.error("Erreur d'authentification: Impossible de récupérer le token d'authentification");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token d'authentification:", error);
        toast.error("Erreur lors de la récupération du token d'authentification");
      }
    };
    
    getAuthToken();
  }, []);
  
  // Fetch campaigns when page changes or account changes
  useEffect(() => {
    // Au chargement initial et aux changements de page, charger depuis le cache sans forcer le refresh
    refetch({ forceRefresh: false });
  }, [refetch, currentPage, account]);

  // Calcul du nombre total de pages en fonction du nombre total de campagnes
  useEffect(() => {
    const calculateTotalPages = async () => {
      try {
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
  }, [account?.id, campaignsCount, currentPage, itemsPerPage]);

  // Rafraîchir manuellement les campagnes
  const handleRefresh = useCallback(async () => {
    setIsManuallyRefreshing(true);
    setConnectionError(null);
    
    try {
      // Forcer le rafraîchissement des données
      await refetch({ forceRefresh: true });
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
    if (!accessToken || !account) {
      toast.error("Impossible de synchroniser: token ou compte manquant", { id: "sync" });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      toast.loading("Synchronisation des campagnes...", { id: "sync" });
      const result = await forceSyncCampaigns(account, accessToken);
      
      if (result.success) {
        toast.success(result.message, { id: "sync" });
        await refetch({ forceRefresh: false });
      } else {
        toast.error(result.message, { id: "sync" });
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation:", err);
      toast.error("Erreur lors de la synchronisation des campagnes", { id: "sync" });
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, account, refetch]);

  // Traitement des campagnes filtrées avec le hook
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
    console.log(`Changement de page: ${page}`);
  };

  // Si le compte est inactif
  if (account?.status !== 'active') {
    return <InactiveAccountState />;
  }

  // Afficher un état de chargement
  if (isLoading) {
    return <TableLoadingState />;
  }

  // Afficher un état d'erreur
  if (isError) {
    return (
      <TableErrorState 
        error={error instanceof Error ? error.message : "Une erreur est survenue"} 
        onRetry={() => {
          setRetryCount((prev) => prev + 1);
          refetch({ forceRefresh: false });
        }}
        retryCount={retryCount}
      />
    );
  }

  // Si aucune campagne n'est trouvée
  if (!filteredCampaigns?.length) {
    return <EmptyState onSync={handleSync} />;
  }

  // Ajouter un indicateur de mode développeur dans le rendu
  if (ACELLE_DEV_MODE) {
    return (
      <div className="space-y-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Mode Développeur Actif - Les données affichées sont générées localement</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Les appels API à Acelle sont simulés. Désactivez le mode développeur dans <code>config.ts</code> pour utiliser l'API réelle.
            </p>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <AcelleTableFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <div className="flex flex-wrap gap-2 items-center">
              {backgroundRefreshInProgress && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Actualisation en cours...
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isManuallyRefreshing || backgroundRefreshInProgress}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing || !accessToken || backgroundRefreshInProgress}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Synchroniser
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
        </div>
      </div>
    );
  }

  // Si le compte est inactif
  if (account?.status !== 'active') {
    return <InactiveAccountState />;
  }

  // Afficher un état de chargement
  if (isLoading) {
    return <TableLoadingState />;
  }

  // Afficher un état d'erreur
  if (isError) {
    return (
      <TableErrorState 
        error={error instanceof Error ? error.message : "Une erreur est survenue"} 
        onRetry={() => {
          setRetryCount((prev) => prev + 1);
          refetch({ forceRefresh: false });
        }}
        retryCount={retryCount}
      />
    );
  }

  // Si aucune campagne n'est trouvée
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
          {backgroundRefreshInProgress && (
            <div className="text-sm text-muted-foreground flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Actualisation en cours...
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManuallyRefreshing || backgroundRefreshInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !accessToken || backgroundRefreshInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Synchroniser
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
    </div>
  );
}

// Fonction de test pour déboguer avec des données factices
const fetchMockCampaignStatistics = async () => {
  console.log("Génération de fausses statistiques pour debug");
  
  // Données factices pour test
  return {
    success: true,
    stats: {
      subscriber_count: 100,
      delivered_count: 95,
      open_count: 50,
      click_count: 25,
      delivered_rate: 95,
      open_rate: 52.6,
      click_rate: 26.3,
      bounce_count: 5,
      unsubscribe_count: 2,
      status: "sent",
      uniq_open_count: 48,
      uniq_open_rate: 50.5,
      soft_bounce_count: 2,
      hard_bounce_count: 3,
      abuse_complaint_count: 1
    }
  };
};
