
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
import { useAcelleCampaigns } from "@/hooks/acelle/useAcelleCampaigns";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import { CampaignsTableHeader } from "./table/TableHeader";
import {
  TableLoadingState,
  TableErrorState,
  EmptyState,
  InactiveAccountState
} from "./table/LoadingAndErrorStates";
import AcelleCampaignDetails from "./AcelleCampaignDetails";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCampaignCache } from "@/hooks/acelle/useCampaignCache";
import { forceSyncCampaigns } from "@/services/acelle/api/campaigns";
import { SyncProgressDialog } from "./SyncProgressDialog";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, message: "" });
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  const { 
    campaignsCount, 
    getCachedCampaignsCount, 
    clearAccountCache,
    lastRefreshTimestamp,
    isCacheBusy
  } = useCampaignCache(account);

  // Mode cache par défaut - afficher TOUTES les campagnes du cache
  const {
    campaigns,
    isLoading,
    error,
    totalCount,
    cacheStatus,
    refresh
  } = useAcelleCampaigns(account, {
    useCache: true // Toujours utiliser le cache pour l'affichage ROBUSTE
  });

  console.log(`[AcelleCampaignsTable] ROBUSTE - Rendu pour ${account.name}: ${campaigns.length} campagnes affichées, ${totalCount} total`);

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

  // Mettre à jour le statut de connexion
  useEffect(() => {
    if (isLoading) {
      setConnectionStatus('checking');
    } else if (error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('ok');
    }
  }, [isLoading, error]);

  // Rafraîchissement manuel simple
  const handleRefresh = useCallback(async () => {
    setIsManuallyRefreshing(true);
    setConnectionError(null);
    
    try {
      await refresh();
      await getCachedCampaignsCount();
      toast.success("Cache actualisé", { id: "refresh" });
    } catch (err) {
      console.error("Erreur rafraîchissement:", err);
      toast.error("Erreur de rafraîchissement", { id: "refresh" });
      setConnectionError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [refresh, getCachedCampaignsCount]);

  // Synchronisation COMPLÈTE avec progression
  const handleFullSync = useCallback(async () => {
    if (!accessToken || !account) {
      toast.error("Token ou compte manquant", { id: "full-sync" });
      return;
    }
    
    setIsFullSyncing(true);
    setSyncProgress({ current: 0, total: 0, message: "Démarrage synchronisation COMPLÈTE..." });
    
    try {
      console.log(`[AcelleCampaignsTable] ROBUSTE - Début synchronisation COMPLÈTE pour ${account.name}`);
      
      const result = await forceSyncCampaigns(account, accessToken, (progress) => {
        setSyncProgress(progress);
      });
      
      if (result.success) {
        toast.success(`${result.totalCampaigns || 0} campagnes synchronisées COMPLÈTEMENT !`, { id: "full-sync" });
        console.log(`[AcelleCampaignsTable] ROBUSTE - Synchronisation RÉUSSIE: ${result.totalCampaigns} campagnes`);
        
        // Actualiser le cache et les données
        await getCachedCampaignsCount();
        await refresh();
      } else {
        toast.error(result.message, { id: "full-sync" });
        console.error(`[AcelleCampaignsTable] ROBUSTE - Synchronisation échouée: ${result.message}`);
      }
    } catch (err) {
      console.error("Erreur synchronisation COMPLÈTE:", err);
      toast.error("Erreur de synchronisation COMPLÈTE", { id: "full-sync" });
    } finally {
      setIsFullSyncing(false);
      setSyncProgress({ current: 0, total: 0, message: "" });
    }
  }, [accessToken, account, refresh, getCachedCampaignsCount]);

  // Vider le cache COMPLÈTEMENT
  const handleClearCache = useCallback(async () => {
    if (!account) return;
    
    if (confirm(`Êtes-vous sûr de vouloir vider COMPLÈTEMENT le cache pour ${account.name} ?`)) {
      try {
        await clearAccountCache();
        await refresh();
        toast.success("Cache vidé COMPLÈTEMENT avec succès");
      } catch (err) {
        console.error("Erreur lors du vidage COMPLET du cache:", err);
        toast.error("Erreur lors du vidage COMPLET du cache");
      }
    }
  }, [account, clearAccountCache, refresh]);

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

  // Indicateur de statut ROBUSTE
  const ConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Vérification cache ROBUSTE...
          </div>
        );
      case 'ok':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            Cache ROBUSTE OK
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-3 w-3" />
            Erreur cache ROBUSTE
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

  if (error) {
    return (
      <TableErrorState 
        error={error} 
        onRetry={handleRefresh}
        retryCount={0}
      />
    );
  }

  if (!campaigns?.length) {
    return <EmptyState onSync={handleFullSync} />;
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
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Database className="h-3 w-3" />
            {totalCount} campagnes COMPLÈTES en cache
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManuallyRefreshing || isFullSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
            Actualiser cache
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleFullSync}
            disabled={isFullSyncing || !accessToken}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFullSyncing ? "animate-spin" : ""}`} />
            Sync API COMPLÈTE
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearCache}
            disabled={isCacheBusy || isFullSyncing}
          >
            Vider cache COMPLET
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
          Dernière synchronisation COMPLÈTE: {new Date(lastRefreshTimestamp).toLocaleString()}
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

      {/* Affichage ROBUSTE du total */}
      <div className="flex justify-center items-center mt-4 text-sm text-muted-foreground">
        Affichage COMPLET de {filteredCampaigns.length} campagnes sur {totalCount} au total
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
