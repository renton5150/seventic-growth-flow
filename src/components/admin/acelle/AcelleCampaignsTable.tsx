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
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { getAcelleCampaigns, forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { wakeupCorsProxy } from "@/services/acelle/cors-proxy";

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
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Utiliser notre hook useCampaignCache pour les opérations de cache
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    isCacheBusy
  } = useCampaignCache(account);
  
  // Create a refetch function to reload the campaigns
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setConnectionError(null);
    
    try {
      if (account?.id) {
        // Réveiller le proxy CORS avant de faire des requêtes
        if (accessToken) {
          await wakeupCorsProxy(accessToken);
        }
        
        // Utiliser notre nouvelle API pour récupérer les campagnes
        const fetchedCampaigns = await getAcelleCampaigns(account, { 
          refresh: true 
        });
        
        setCampaigns(fetchedCampaigns);
        console.log(`${fetchedCampaigns.length} campagnes récupérées avec succès`);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns");
      setConnectionError("Impossible de récupérer les campagnes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [account, accessToken]);

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
        } else {
          console.log("Aucun token d'authentification disponible");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token:", error);
      }
    };
    
    getAuthToken();
  }, []);
  
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
  }, [account, currentPage, itemsPerPage, refetch]);
  
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
      await wakeupCorsProxy(accessToken);
      
      const result = await forceSyncCampaigns(account, accessToken);
      
      if (result.success) {
        toast.success(result.message, { id: "sync-toast" });
        // Attendre un moment pour laisser le temps à la synchronisation de s'effectuer
        setTimeout(() => refetch(), 2000);
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
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleForceSync}
          disabled={isManuallyRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isManuallyRefreshing ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      </div>
      
      {connectionError && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-amber-800">{connectionError}</span>
          </CardContent>
        </Card>
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
