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
    useCache: true // Toujours utiliser le cache pour l'affichage
  });

  console.log(`[AcelleCampaignsTable] NOUVEAU - ${account.name}: ${campaigns.length} campagnes affichées, ${totalCount} total`);

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
    setSyncProgress({ current: 0, total: 0, message: "Démarrage synchronisation NOUVELLE VERSION..." });
    
    try {
      console.log(`[AcelleCampaignsTable] NOUVELLE VERSION - Début synchronisation pour ${account.name}`);
      
      const result = await forceSyncCampaigns(account, accessToken, (progress) => {
        setSyncProgress(progress);
      });
      
      if (result.success) {
        toast.success(`✅ ${result.totalCampaigns || 0} campagnes synchronisées pour ${account.name} !`, { 
          id: "full-sync",
          duration: 5000
        });
        console.log(`[AcelleCampaignsTable] NOUVELLE VERSION - Synchronisation RÉUSSIE: ${result.totalCampaigns} campagnes`);
        
        // Actualiser le cache et les données
        await getCachedCampaignsCount();
        await refresh();
        
        // Message de succès spécifique
        setConnectionError(null);
        toast.success(`🎉 Toutes les campagnes de ${account.name} sont maintenant disponibles !`, {
          duration: 8000
        });
      } else {
        toast.error(`❌ ${result.message}`, { id: "full-sync" });
        setConnectionError(result.message);
        console.error(`[AcelleCampaignsTable] Synchronisation échouée: ${result.message}`);
      }
    } catch (err) {
      console.error("Erreur synchronisation:", err);
      const errorMsg = err instanceof Error ? err.message : "Erreur de synchronisation";
      toast.error(`❌ ${errorMsg}`, { id: "full-sync" });
      setConnectionError(errorMsg);
    } finally {
      setIsFullSyncing(false);
      setSyncProgress({ current: 0, total: 0, message: "" });
    }
  }, [accessToken, account, refresh, getCachedCampaignsCount]);

  // Vider le cache
  const handleClearCache = useCallback(async () => {
    if (!account) return;
    
    if (confirm(`Êtes-vous sûr de vouloir vider le cache pour ${account.name} ?`)) {
      try {
        await clearAccountCache();
        await refresh();
        toast.success("Cache vidé avec succès");
      } catch (err) {
        console.error("Erreur lors du vidage du cache:", err);
        toast.error("Erreur lors du vidage du cache");
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

  // Indicateur de statut
  const ConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Vérification cache...
          </div>
        );
      case 'ok':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            Cache OK
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-3 w-3" />
            Erreur cache
          </div>
        );
      default:
        return null;
    }
  };

  // Si le compte est inactif
  if (account?.status !== 'active') {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Compte Acelle inactif</h3>
        <p className="text-gray-600 mb-4">
          Le compte {account.name} est marqué comme inactif. 
        </p>
        <Button onClick={handleFullSync} disabled={isFullSyncing || !accessToken}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFullSyncing ? "animate-spin" : ""}`} />
          Activer et synchroniser
        </Button>
      </div>
    );
  }

  // États d'affichage
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner className="h-8 w-8 mb-4" />
        <p className="text-gray-600">Chargement des campagnes pour {account.name}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isManuallyRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isManuallyRefreshing ? "animate-spin" : ""}`} />
            Actualiser cache
          </Button>
          <Button onClick={handleFullSync} disabled={isFullSyncing || !accessToken}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFullSyncing ? "animate-spin" : ""}`} />
            Synchroniser depuis API
          </Button>
        </div>
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune campagne trouvée</h3>
        <p className="text-gray-600 mb-4">
          Aucune campagne n'est disponible en cache pour {account.name}.
        </p>
        <Button onClick={handleFullSync} disabled={isFullSyncing || !accessToken} size="lg">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFullSyncing ? "animate-spin" : ""}`} />
          Synchroniser les campagnes depuis l'API
        </Button>
        {isFullSyncing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">{syncProgress.message}</p>
            {syncProgress.total > 0 && (
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques et actions */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Campagnes {account.name}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <ConnectionStatusIndicator />
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Database className="h-3 w-3" />
                {totalCount} campagnes en cache
              </div>
              {lastRefreshTimestamp && (
                <div className="text-xs text-gray-500">
                  Dernière sync: {new Date(lastRefreshTimestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
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
              Vider cache
            </Button>
          </div>
        </div>
      </div>
      
      {connectionError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium">Erreur de synchronisation</p>
              <p className="text-sm">{connectionError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <AcelleTableFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      
      {/* Tableau des campagnes */}
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

      {/* Affichage du total */}
      <div className="flex justify-center items-center mt-4 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
        <span className="font-medium">
          Affichage de {filteredCampaigns.length} campagnes sur {totalCount} au total pour {account.name}
        </span>
      </div>

      {/* Dialogue des détails de campagne */}
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

      {/* Dialogue de progression de synchronisation */}
      <SyncProgressDialog 
        isOpen={isFullSyncing}
        progress={syncProgress}
      />
    </div>
  );
}
