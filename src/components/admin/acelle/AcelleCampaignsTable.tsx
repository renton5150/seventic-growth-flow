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
  const [demoMode, setDemoMode] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
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
        toast.error("Erreur lors de la récup��ration du token d'authentification");
        
        // Activer le mode démo automatiquement en cas d'erreur d'authentification
        enableDemoMode(true);
      }
    };
    
    getAuthToken();
  }, []);

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

  // Générer des campagnes factices pour le mode démo
  const generateDemoCampaigns = useCallback((page: number = 1, perPage: number = 5): AcelleCampaign[] => {
    const statuses = ["sent", "sending", "queued", "ready", "new", "paused", "failed"];
    const subjectPrefixes = ["Newsletter", "Promotion", "Annonce", "Invitation", "Bienvenue"];
    
    // Décaler l'index de départ en fonction de la page
    const startIndex = (page - 1) * perPage;
    
    return Array.from({ length: perPage }).map((_, index) => {
      const now = new Date();
      const globalIndex = startIndex + index;
      const randomDays = Math.floor(Math.random() * 30);
      const createdDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const subject = `${subjectPrefixes[Math.floor(Math.random() * subjectPrefixes.length)]} ${globalIndex + 1}`;
      
      // Créer une campagne simulée avec statistiques
      const simulatedStats = acelleService.generateMockCampaigns(1)[0];
      
      return {
        uid: `demo-${globalIndex}`,
        campaign_uid: `demo-${globalIndex}`,
        name: `Campagne démo ${globalIndex + 1}`,
        subject: subject,
        status: status,
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
        delivery_date: status === "new" ? null : new Date().toISOString(),
        run_at: null,
        delivery_info: simulatedStats.delivery_info,
        statistics: simulatedStats.statistics
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
  
  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    
    setCurrentPage(page);
    console.log(`Changement de page: ${page}`);
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
