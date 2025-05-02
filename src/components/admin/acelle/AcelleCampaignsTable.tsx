
import React, { useState, useEffect, useCallback } from "react";
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
import { RefreshCw, Bug, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { enrichCampaignsWithStats } from "@/services/acelle/api/directStats";

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
  const [demoMode, setDemoMode] = useState(false);
  
  // Utiliser notre hook useCampaignCache pour les opérations de cache
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    checkCacheStatistics,
    lastRefreshTimestamp,
    isCacheBusy
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
          
          // Activer le mode démo automatiquement si pas d'authentification
          enableDemoMode(true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token d'authentification:", error);
        toast.error("Erreur lors de la récupération du token d'authentification");
        
        // Activer le mode démo automatiquement en cas d'erreur d'authentification
        enableDemoMode(true);
      }
    };
    
    getAuthToken();
  }, []);

  // Récupérer les campagnes du cache avec la query key incluse
  const { data: campaigns, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['campaigns', account?.id, currentPage, demoMode],
    queryFn: async () => {
      if (demoMode) {
        // En mode démo, générer des campagnes factices
        return generateDemoCampaigns();
      }
      
      if (!account?.id || account?.status !== 'active') {
        return [];
      }
      
      try {
        const cachedCampaigns = await fetchCampaignsFromCache([account], currentPage, itemsPerPage);
        console.log(`${cachedCampaigns.length} campagnes récupérées du cache`);
        
        // Enrichir les campagnes avec les statistiques à jour
        if (cachedCampaigns.length > 0) {
          const enrichedCampaigns = await enrichCampaignsWithStats(cachedCampaigns, account);
          return enrichedCampaigns;
        }
        
        return cachedCampaigns;
      } catch (err) {
        console.error("Erreur lors de la récupération des campagnes:", err);
        setConnectionError(err instanceof Error ? err.message : "Erreur inconnue");
        return [];
      }
    },
    enabled: !!account?.id || demoMode,
    retry: 1,
    staleTime: 30000 // 30 secondes
  });

  // Générer des campagnes factices pour le mode démo
  const generateDemoCampaigns = useCallback((): AcelleCampaign[] => {
    const statuses = ["sent", "sending", "queued", "ready", "new", "paused", "failed"];
    const subjectPrefixes = ["Newsletter", "Promotion", "Annonce", "Invitation", "Bienvenue"];
    
    return Array.from({ length: 5 }).map((_, index) => {
      const now = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      const createdDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const subject = `${subjectPrefixes[Math.floor(Math.random() * subjectPrefixes.length)]} ${index + 1}`;
      
      return {
        uid: `demo-${index}`,
        campaign_uid: `demo-${index}`,
        name: `Campagne démo ${index + 1}`,
        subject: subject,
        status: status,
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
        delivery_date: status === "new" ? null : new Date().toISOString(),
        run_at: null,
        delivery_info: {},
        statistics: {}
      } as AcelleCampaign;
    });
  }, []);

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
        await refetch();
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
    setSelectedCampaign(uid);
  };

  // Fermer la vue détaillée
  const handleCloseDetails = () => {
    setSelectedCampaign(null);
  };

  // Si le compte est inactif
  if (account?.status !== 'active' && !demoMode) {
    return <InactiveAccountState />;
  }

  // Afficher un état de chargement
  if (isLoading && !demoMode) {
    return <TableLoadingState />;
  }

  // Afficher un état d'erreur
  if (isError && !demoMode) {
    return (
      <TableErrorState 
        error={error instanceof Error ? error.message : "Une erreur est survenue"} 
        onRetry={() => {
          setRetryCount((prev) => prev + 1);
          refetch();
        }}
        retryCount={retryCount}
      />
    );
  }

  // Si aucune campagne n'est trouvée
  if (!filteredCampaigns?.length && !demoMode) {
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManuallyRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !accessToken}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Synchroniser
          </Button>
          
          <Button
            variant={demoMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => enableDemoMode(!demoMode)}
          >
            <Bug className="h-4 w-4 mr-2" />
            {demoMode ? "Désactiver démo" : "Mode démo"}
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
                demoMode={demoMode}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {campaigns && campaigns.length > itemsPerPage && (
        <CampaignsTablePagination 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          hasNextPage={hasNextPage}
        />
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => {
        if (!open) handleCloseDetails();
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {campaigns?.find(c => c.uid === selectedCampaign || c.campaign_uid === selectedCampaign)?.name || "Détails de la campagne"}
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <AcelleCampaignDetails 
              campaignId={selectedCampaign} 
              account={account} 
              onClose={handleCloseDetails}
              demoMode={demoMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
