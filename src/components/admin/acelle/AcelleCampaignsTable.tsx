import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { acelleService } from "@/services/acelle/acelle-service";
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
import { RefreshCw, Bug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { forceSyncCampaigns } from "@/services/acelle/api/campaigns";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
  onDemoMode?: (isDemoMode: boolean) => void;
}

export default function AcelleCampaignsTable({ account, onDemoMode }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Limité à 5 campagnes par page
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); 
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Utiliser notre hook useCampaignCache pour les opérations de cache
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    checkCacheStatistics,
    lastRefreshTimestamp
  } = useCampaignCache(account);

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
    
    // Rafraîchir le token périodiquement (toutes les 15 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        console.log("Rafraîchissement périodique du token d'authentification");
        await supabase.auth.refreshSession();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Token d'authentification rafraîchi avec succès");
          setAccessToken(token);
        }
      } catch (e) {
        console.error("Erreur lors du rafraîchissement périodique:", e);
      }
    }, 15 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Function to wake up Edge Functions
  const wakeUpEdgeFunctions = async () => {
    try {
      console.log("Tentative de réveil des Edge Functions");
      
      if (!accessToken) {
        console.error("Pas de session d'authentification disponible pour la requête de réveil");
        return false;
      }
      
      const wakeUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping';
      console.log(`Envoi de la requête de réveil à: ${wakeUrl}`);
      
      try {
        const response = await fetch(wakeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Réveil des Edge Functions réussi:", data);
          return true;
        } else {
          console.error(`Échec du réveil des Edge Functions: ${response.status}`);
        }
      } catch (e) {
        console.warn("La requête de réveil a échoué, ceci est attendu dans l'environnement de développement:", e);
      }
      
      // Même si le réveil a échoué, retourner true pour continuer avec le flux
      return true;
    } catch (e) {
      console.error("Erreur dans wakeUpEdgeFunctions:", e);
      return false;
    }
  };
  
  const handleForceSyncNow = async () => {
    try {
      setIsSyncing(true);
      toast.loading("Synchronisation forcée des campagnes...", { id: "force-sync" });
      
      // S'assurer d'avoir un token d'authentification valide
      if (!accessToken) {
        const { data } = await supabase.auth.getSession();
        if (!data?.session?.access_token) {
          toast.error("Authentification requise pour la synchronisation", { id: "force-sync" });
          return;
        }
        setAccessToken(data.session.access_token);
      }
      
      // Réveiller les services avant la synchronisation
      await wakeUpEdgeFunctions();
      
      // Fix: Pass only the required arguments to forceSyncCampaigns
      const result = await forceSyncCampaigns(account, accessToken);
      
      if (result.success) {
        toast.success(`${result.message} (${result.syncedCount || 0} campagnes)`, { id: "force-sync" });
        // Actualiser le comptage et les données
        await getCachedCampaignsCount();
        setRetryCount(prev => prev + 1); // Force un rechargement des données
      } else {
        toast.error(`Échec de la synchronisation: ${result.message}`, { id: "force-sync" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMessage}`, { id: "force-sync" });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Fix: Make sure checkStats handles the response properly
  const checkStats = async () => {
    try {
      toast.loading("Vérification des statistiques...", { id: "check-stats" });
      const stats = await checkCacheStatistics();
      
      if (stats.hasStats) {
        toast.success(`Statistiques disponibles: ${stats.campaignsWithStats}/${stats.totalCampaigns} campagnes avec données`, { id: "check-stats" });
      } else {
        toast.warning(`Aucune statistique trouvée dans les ${stats.totalCampaigns} campagnes vérifiées`, { id: "check-stats" });
      }
      
      // Afficher un exemple de statistiques si disponible
      if (stats.sampleStats) {
        console.log("Exemple de statistiques disponibles:", stats.sampleStats);
      }
    } catch (error) {
      toast.error("Erreur lors de la vérification des statistiques", { id: "check-stats" });
    }
  };
  
  const fetchCampaigns = React.useCallback(async () => {
    console.log(`Récupération des campagnes pour le compte: ${account.name}, page: ${currentPage}, limite: ${itemsPerPage}`);
    try {
      // Effacer les erreurs de connexion précédentes
      setConnectionError(null);
      toast.loading("Récupération des campagnes en cours...", { id: "fetch-campaigns" });
      
      // Essayer de réveiller les Edge Functions mais ne pas bloquer
      await wakeUpEdgeFunctions();
      
      if (!accessToken) {
        console.error("Aucun token d'authentification disponible pour les appels API");
        throw new Error("Authentification requise pour accéder à l'API");
      }
      
      console.log(`Utilisation du token d'accès pour les appels API: ${accessToken ? 'présent' : 'absent'}`);
      
      // Ajouter le token d'accès à l'appel API
      let campaigns;
      try {
        campaigns = await acelleService.getAcelleCampaigns(
          account, 
          currentPage, 
          itemsPerPage, 
          accessToken
        );
        
        console.log(`Récupération réussie de ${campaigns?.length || 0} campagnes depuis l'API`);
        
        // Log détaillé du premier élément pour débogage
        if (campaigns && campaigns.length > 0) {
          console.log("Exemple de campagne récupérée:", {
            name: campaigns[0].name,
            stats: campaigns[0].statistics,
            delivery_info: campaigns[0].delivery_info
          });
        }
        
        // Déterminer s'il y a une page suivante
        setHasNextPage(campaigns.length === itemsPerPage);
        
        // Vérifier si les campagnes ont des statistiques
        const hasStats = campaigns.some(c => 
          c.statistics && (c.statistics.subscriber_count > 0 || c.statistics.delivered_count > 0)
        );
        
        if (!hasStats) {
          console.warn("Les campagnes récupérées n'ont pas de statistiques! Vérifier l'API");
          
          // Si pas de stats, synchroniser uniquement cette page de campagnes
          if (!isSyncing) {
            const synchroResult = await forceSyncCampaigns(account, accessToken, itemsPerPage);
            if (synchroResult.success) {
              console.log("Synchronisation automatique de la page réussie");
            }
          }
        } else {
          console.log("Statistiques trouvées dans les campagnes récupérées");
        }
      } catch (apiError) {
        console.error("Requête API échouée:", apiError);
        
        // Essayer de récupérer depuis le cache
        console.log("Tentative de récupération des campagnes depuis le cache comme solution de repli");
        const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
        
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          console.log(`Récupéré ${cachedCampaigns.length} campagnes depuis le cache`);
          campaigns = cachedCampaigns;
          setHasNextPage(cachedCampaigns.length === itemsPerPage);
        } else {
          console.log("Aucune campagne disponible dans le cache, utilisation des données de démonstration");
          throw apiError;
        }
      }
      
      if (campaigns && campaigns.length > 0) {
        console.log(`Récupération réussie de ${campaigns.length} campagnes`);
        toast.success(`${campaigns.length} campagnes récupérées avec succès`, { id: "fetch-campaigns" });
        
        // Notifier le parent que nous utilisons des données réelles
        if (onDemoMode) {
          onDemoMode(false);
        }
        
        return campaigns;
      } else {
        console.log("Aucune campagne retournée, affichage des campagnes de démonstration");
        toast.warning("Données temporaires affichées pour démonstration", { id: "fetch-campaigns" });
        
        // Notifier le parent que nous utilisons des données de démonstration
        if (onDemoMode) {
          onDemoMode(true);
        }
        
        // Générer 5 campagnes de démonstration
        return acelleService.generateMockCampaigns(5);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des campagnes:`, error);
      setConnectionError(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      toast.error("Erreur lors de la récupération des campagnes", { id: "fetch-campaigns" });
      
      // Notifier le parent que nous utilisons des données de démonstration en raison d'une erreur
      if (onDemoMode) {
        onDemoMode(true);
      }
      
      // Retourner des campagnes de démonstration comme solution de repli
      return acelleService.generateMockCampaigns(5);
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [account, currentPage, itemsPerPage, onDemoMode, accessToken, isSyncing]);
  
  const { 
    data: campaigns = [], 
    isLoading, 
    isError,
    isFetching,
    error,
    refetch 
  } = useQuery({
    queryKey: ["acelleCampaigns", account.id, currentPage, itemsPerPage, retryCount, accessToken],
    queryFn: fetchCampaigns,
    enabled: account.status === "active" && !!accessToken,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
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
  } = useAcelleCampaignsTable(campaigns);

  // Réinitialiser à la page 1 lorsque les filtres changent
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Fonction pour forcer une nouvelle tentative
  const handleRetry = () => {
    setIsManuallyRefreshing(true);
    setRetryCount(prev => prev + 1);
    refetch();
  };
  
  // Toggle des informations de débogage
  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };

  if (account.status === "inactive") {
    return <InactiveAccountState />;
  }

  if (!accessToken) {
    return (
      <div className="p-8 text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p>Authentification en cours...</p>
        <p className="text-sm text-gray-500 mt-4">Si cette page persiste, essayez de vous reconnecter.</p>
      </div>
    );
  }

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (isError || connectionError) {
    return (
      <TableErrorState 
        onRetry={handleRetry}
        errorMessage={connectionError || "Une erreur est survenue lors de la récupération des campagnes"}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campagnes pour {account.name}</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStats}
            title="Vérifier les statistiques dans le cache"
          >
            <Bug className="h-4 w-4 mr-1" />
            Vérifier les stats
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDebugInfo}
          >
            {showDebugInfo ? "Masquer" : "Afficher"} les infos de débogage
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleForceSyncNow} 
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser maintenant
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry} 
            disabled={isFetching || isManuallyRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching || isManuallyRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>
      
      {showDebugInfo && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950">
          <CardContent className="p-4 text-sm">
            <h4 className="font-bold mb-2">Informations de débogage</h4>
            <div className="space-y-1">
              <p><strong>Endpoint API:</strong> {account.apiEndpoint}</p>
              <p><strong>Dernière synchronisation:</strong> {account.lastSyncDate ? new Date(account.lastSyncDate).toLocaleString() : 'Jamais'}</p>
              <p><strong>Cache:</strong> {campaignsCount} campagnes, dernier rafraîchissement {lastRefreshTimestamp?.toLocaleString() || 'jamais'}</p>
              {account.lastSyncError && (
                <p className="text-red-600"><strong>Dernière erreur:</strong> {account.lastSyncError}</p>
              )}
              <p><strong>Page courante:</strong> {currentPage}, <strong>Campagnes par page:</strong> {itemsPerPage}</p>
              <p><strong>Status de la requête:</strong> {isLoading ? 'Chargement' : (isError ? 'Erreur' : 'Succès')}</p>
              {error && (
                <p className="text-red-600">
                  <strong>Erreur:</strong> {error instanceof Error ? error.message : 'Erreur inconnue'}
                </p>
              )}
              <p><strong>Nombre de campagnes chargées:</strong> {campaigns.length}</p>
              <p><strong>Nombre de campagnes filtrées affichées:</strong> {filteredCampaigns.length}</p>
              <p><strong>Token d'authentification:</strong> {accessToken ? 'Présent' : 'Manquant'}</p>
              <p className="text-sm text-gray-500 mt-2">
                Note: En cas d'erreur de connexion, des données exemples sont affichées pour simulation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AcelleTableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />
      
      {filteredCampaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="border rounded-md relative">
            {(isFetching || isManuallyRefreshing) && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <Spinner className="h-8 w-8 border-primary" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'envoi</TableHead>
                  <TableHead>Total envoyé</TableHead>
                  <TableHead>Taux d'ouverture</TableHead>
                  <TableHead>Taux de clic</TableHead>
                  <TableHead>Bounce</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <AcelleTableRow
                    key={campaign.uid || campaign.campaign_uid}
                    campaign={campaign}
                    onViewCampaign={(uid) => setSelectedCampaign(uid)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          
          <CampaignsTablePagination
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl h-[80vh] max-h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la campagne</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <AcelleCampaignDetails 
              account={account}
              campaignUid={selectedCampaign}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
