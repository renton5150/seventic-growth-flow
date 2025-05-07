import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import { CampaignsTableHeader } from "./table/CampaignsTableHeader";
import { CampaignsTablePagination } from "./table/TablePagination";
import {
  TableLoadingState,
  TableErrorState,
  EmptyState,
  InactiveAccountState
} from "./table/EmptyAndLoadingStates";
import AcelleCampaignDetails from "./AcelleCampaignDetails";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Database, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { getAcelleCampaigns, forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { wakeupCorsProxy, getAuthToken } from "@/services/acelle/cors-proxy";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
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
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [proxyStatus, setProxyStatus] = useState<'unknown' | 'ready' | 'error'>('unknown');
  const [isVerifyingProxy, setIsVerifyingProxy] = useState(false);
  const [cacheOnly, setCacheOnly] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Utiliser notre hook useCampaignCache pour les opérations de cache
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    isCacheBusy,
    lastRefreshTimestamp
  } = useCampaignCache(account);
  
  // Vérifier l'état du proxy CORS
  const verifyProxyStatus = useCallback(async () => {
    try {
      setIsVerifyingProxy(true);
      const token = await getAuthToken();
      
      if (!token) {
        setProxyStatus('error');
        return false;
      }
      
      const isReady = await wakeupCorsProxy(token);
      setProxyStatus(isReady ? 'ready' : 'error');
      return isReady;
    } catch (error) {
      console.error("Erreur lors de la vérification du proxy:", error);
      setProxyStatus('error');
      return false;
    } finally {
      setIsVerifyingProxy(false);
    }
  }, []);
  
  // Rafraîchir le proxy
  const handleRefreshProxy = async () => {
    toast.loading("Réveil du proxy en cours...", { id: "proxy-wakeup" });
    const result = await verifyProxyStatus();
    
    if (result) {
      toast.success("Proxy réveillé avec succès", { id: "proxy-wakeup" });
      // Rafraîchir les données automatiquement
      refetch();
    } else {
      toast.error("Impossible de réveiller le proxy", { id: "proxy-wakeup" });
    }
  };
  
  // Create a refetch function to reload the campaigns
  const refetch = useCallback(async (options?: { cacheOnly?: boolean }) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setConnectionError(null);
    setCacheOnly(!!options?.cacheOnly);
    
    try {
      if (account?.id) {
        let fetchedCampaigns: AcelleCampaign[] = [];
        
        if (options?.cacheOnly) {
          // Utiliser uniquement le cache
          const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
          fetchedCampaigns = cachedCampaigns;
          console.log(`${cachedCampaigns.length} campagnes récupérées depuis le cache`);
        } else {
          // Réveiller le proxy CORS avant de faire des requêtes
          if (accessToken) {
            const proxyReady = await wakeupCorsProxy(accessToken);
            setProxyStatus(proxyReady ? 'ready' : 'error');
            
            if (!proxyReady) {
              console.warn("Le proxy n'est pas disponible, utilisation du cache uniquement");
              const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
              fetchedCampaigns = cachedCampaigns;
              setConnectionError("Le proxy n'est pas disponible. Données affichées depuis le cache.");
              setCacheOnly(true);
            } else {
              // Utiliser notre nouvelle API pour récupérer les campagnes
              try {
                fetchedCampaigns = await getAcelleCampaigns(account, { refresh: true });
                console.log(`${fetchedCampaigns.length} campagnes récupérées avec succès depuis l'API`);
                setConnectionError(null);
              } catch (apiError) {
                console.error("Erreur lors de la récupération des campagnes de l'API:", apiError);
                setConnectionError(`Erreur API: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
                
                // Fallback sur le cache
                const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
                fetchedCampaigns = cachedCampaigns;
                setCacheOnly(true);
              }
            }
          } else {
            // Si pas de token d'auth, utiliser le cache
            const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
            fetchedCampaigns = cachedCampaigns;
            setConnectionError("Pas de token d'authentification disponible. Données affichées depuis le cache.");
            setCacheOnly(true);
          }
        }
        
        setCampaigns(fetchedCampaigns);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns");
      setConnectionError("Impossible de récupérer les campagnes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [account, accessToken, currentPage, itemsPerPage]);
  
  // Obtenir le token d'authentification dès le montage du composant
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        console.log("Récupération du token d'authentification pour les requêtes API");
        // Rafraîchir la session pour s'assurer que le token est à jour
        await supabase.auth.refreshSession();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Token d'authentification récupéré avec succès");
          setAccessToken(token);
          
          // Vérifier l'état du proxy
          verifyProxyStatus();
        } else {
          console.log("Aucun token d'authentification disponible");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token:", error);
      }
    };
    
    getAuthToken();
  }, [verifyProxyStatus]);
  
  // Charger les campagnes au montage
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!account?.id) return;
      
      try {
        setIsLoading(true);
        setIsError(false);
        
        // Essayer de récupérer depuis le cache d'abord
        const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
        
        // Mettre à jour les états même si le cache est vide
        setCampaigns(cachedCampaigns);
        
        // Si le cache est vide, forcer un rafraîchissement depuis l'API
        if (cachedCampaigns.length === 0) {
          console.log("Cache vide, chargement depuis l'API...");
          await refetch();
        } else {
          setIsLoading(false);
          
          // Tenter de rafraîchir en arrière-plan
          if (accessToken) {
            refetch();
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des campagnes:", err);
        setIsError(true);
        setError(err instanceof Error ? err.message : "Erreur de chargement des campagnes");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaigns();
  }, [account, currentPage, itemsPerPage, refetch, accessToken]);
  
  // Mettre à jour la pagination
  useEffect(() => {
    const updatePagination = async () => {
      if (!account?.id) return;
      
      try {
        const count = await getCachedCampaignsCount();
        const pages = Math.ceil(count / itemsPerPage) || 1;
        setTotalPages(pages);
        setHasNextPage(currentPage < pages);
        
        console.log(`Pagination mise à jour: ${count} campagnes, ${pages} pages`);
      } catch (error) {
        console.error("Erreur lors du calcul de la pagination:", error);
      }
    };
    
    updatePagination();
  }, [account?.id, campaignsCount, currentPage, getCachedCampaignsCount, itemsPerPage]);
  
  // Gérer le changement de page
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    try {
      setIsLoading(true);
      const cachedCampaigns = await fetchCampaignsFromCache([account], page, itemsPerPage);
      setCampaigns(cachedCampaigns);
    } catch (error) {
      console.error("Erreur lors du changement de page:", error);
      setConnectionError("Erreur lors du chargement de la page");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour synchroniser les campagnes manuellement
  const handleForceSync = async () => {
    if (!account?.id || !accessToken || isManuallyRefreshing) return;
    
    try {
      setIsManuallyRefreshing(true);
      toast.loading("Synchronisation des campagnes en cours...", { id: "sync-toast" });
      
      console.log("Forçage de la synchronisation des campagnes...");
      // Réveiller le proxy CORS en premier
      const proxyReady = await wakeupCorsProxy(accessToken);
      setProxyStatus(proxyReady ? 'ready' : 'error');
      
      if (!proxyReady) {
        toast.error("Impossible de réveiller le proxy CORS", { id: "sync-toast" });
        return;
      }
      
      const result = await forceSyncCampaigns(account, accessToken);
      
      if (result.success) {
        toast.success(result.message, { id: "sync-toast" });
        // Attendre un moment pour laisser le temps à la synchronisation de s'effectuer
        setTimeout(() => refetch(), 1000);
      } else {
        toast.error(result.message, { id: "sync-toast" });
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast.error("Erreur lors de la synchronisation des campagnes", { id: "sync-toast" });
    } finally {
      setIsManuallyRefreshing(false);
    }
  };
  
  // Gérer l'ouverture de la modal de détails
  const handleOpenDetails = (campaignId: string) => {
    setSelectedCampaign(campaignId);
  };
  
  // Gérer la fermeture de la modal de détails
  const handleCloseDetails = () => {
    setSelectedCampaign(null);
  };
  
  // Afficher l'état approprié
  if (!account || account.status !== 'active') {
    return <InactiveAccountState />;
  }
  
  if (isLoading && campaigns.length === 0) {
    return <TableLoadingState />;
  }
  
  if (isError && campaigns.length === 0) {
    return (
      <TableErrorState 
        error={error ? new Error(error) : null} 
        retryCount={retryCount}
        onRetry={() => {
          setRetryCount(prev => prev + 1);
          refetch();
        }} 
      />
    );
  }
  
  if (campaigns.length === 0) {
    return <EmptyState onSync={handleForceSync} isLoading={isManuallyRefreshing} />;
  }
  
  // Filtrer les campagnes selon les critères de recherche
  const filteredCampaigns = campaigns.filter(campaign => {
    // Filtre de recherche textuelle
    const matchesSearch = !searchTerm || 
      campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre de statut
    const matchesStatus = statusFilter === 'all' || 
      (campaign.status?.toLowerCase() === statusFilter.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });
  
  // Afficher la table des campagnes
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <AcelleTableFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <div className="flex space-x-2">
          {/* Indicateur de source de données */}
          <Button
            variant="outline"
            size="sm"
            className={cacheOnly ? "border-amber-500 text-amber-500" : "border-green-500 text-green-500"}
            disabled={true}
          >
            {cacheOnly ? (
              <>
                <Database className="mr-1 h-4 w-4" />
                Cache
              </>
            ) : (
              <>
                <Wifi className="mr-1 h-4 w-4" />
                API
              </>
            )}
          </Button>
          
          {/* Bouton de réveil du proxy */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshProxy}
            disabled={isVerifyingProxy || proxyStatus === 'ready'}
            className={`${proxyStatus === 'error' ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-blue-500 text-blue-500 hover:bg-blue-50'}`}
          >
            {isVerifyingProxy ? (
              <Spinner className="mr-1 h-4 w-4" />
            ) : (
              <WifiOff className="mr-1 h-4 w-4" />
            )}
            Connecter au proxy
          </Button>
          
          {/* Bouton de synchronisation */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleForceSync}
            disabled={isManuallyRefreshing || proxyStatus !== 'ready'}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isManuallyRefreshing ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
        </div>
      </div>
      
      {connectionError && (
        <Alert variant="warning" className="bg-amber-50 border-amber-300">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          <AlertDescription>
            {connectionError}
          </AlertDescription>
        </Alert>
      )}
      
      {proxyStatus === 'error' && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <AlertDescription>
            Le proxy CORS n'est pas disponible. Les données affichées peuvent être obsolètes. Cliquez sur "Connecter au proxy" pour réessayer.
          </AlertDescription>
        </Alert>
      )}
      
      {cacheOnly && lastRefreshTimestamp && (
        <div className="text-xs text-gray-500 flex items-center mb-2">
          <Database className="h-3 w-3 mr-1" /> 
          Données en cache mises à jour le: {new Date(lastRefreshTimestamp).toLocaleString()}
        </div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <CampaignsTableHeader 
            sortBy="created_at"
            sortOrder="desc"
            onSort={() => {}}
          />
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <AcelleTableRow 
                key={campaign.uid} 
                campaign={campaign}
                onView={handleOpenDetails}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      <CampaignsTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        onPageChange={handlePageChange}
      />
      
      {/* Modal de détails de la campagne */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails de la campagne</DialogTitle>
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
