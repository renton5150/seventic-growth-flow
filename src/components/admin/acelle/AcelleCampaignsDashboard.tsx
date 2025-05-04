
import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, Power, Server, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AcelleAccount } from "@/types/acelle.types";
import { CampaignStatusChart } from "./charts/CampaignStatusChart";
import { DeliveryStatsChart } from "./charts/DeliveryStatsChart";
import { CampaignSummaryStats } from "./stats/CampaignSummaryStats";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAcelleCampaignsDashboard } from "./useAcelleCampaignsDashboard";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
  onDemoMode?: (isDemoMode: boolean) => void;
}

export default function AcelleCampaignsDashboard({ accounts, onDemoMode }: AcelleCampaignsDashboardProps) {
  const { 
    activeAccounts, 
    campaignsData, 
    isLoading, 
    isError, 
    error, 
    syncError, 
    refetch, 
    handleRetry,
    forceSyncNow,
    diagnosticInfo,
    resetCache,
    lastManualSync,
    syncStatus
  } = useAcelleCampaignsDashboard(accounts);
  
  const [isWakingUpServices, setIsWakingUpServices] = useState(false);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  // Exponential backoff for automatic recovery attempts
  const maxRecoveryAttempts = 3;
  const getBackoffDelay = (attempt: number) => Math.min(2000 * Math.pow(2, attempt), 30000);

  // Enhanced recovery mechanism with exponential backoff
  useEffect(() => {
    if (syncError && autoRecoveryEnabled && recoveryAttempts < maxRecoveryAttempts) {
      const shouldAttemptRecovery = syncError.includes("Failed to fetch") || 
                                     syncError.includes("timeout") || 
                                     syncError.includes("shutdown") ||
                                     syncError.includes("API endpoint inaccessible");
      
      if (shouldAttemptRecovery) {
        const delay = getBackoffDelay(recoveryAttempts);
        console.log(`Scheduling automatic recovery attempt #${recoveryAttempts + 1} in ${delay}ms`);
        
        const timer = setTimeout(() => {
          toast.info(`Tentative de récupération automatique #${recoveryAttempts + 1}/${maxRecoveryAttempts}...`);
          setIsWakingUpServices(true);
          handleWakeAndRefresh().finally(() => {
            setIsWakingUpServices(false);
            setRecoveryAttempts(prev => prev + 1);
          });
        }, delay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [syncError, autoRecoveryEnabled, recoveryAttempts]);

  // Reset recovery attempts counter when data is successfully loaded
  useEffect(() => {
    if (campaignsData.length > 0 && !isLoading && !isError && !syncError) {
      setRecoveryAttempts(0);
      
      // Notify parent that we're using real data
      if (onDemoMode) {
        onDemoMode(false);
      }
    } else if ((isError || syncError) && onDemoMode) {
      // Notify parent that we're in demo mode due to errors
      onDemoMode(true);
    }
  }, [campaignsData, isLoading, isError, syncError, onDemoMode]);

  const handleRefresh = useCallback(() => {
    toast.info("Actualisation des données en cours...");
    refetch();
  }, [refetch]);

  const handleWakeAndRefresh = useCallback(async () => {
    setIsWakingUpServices(true);
    toast.info("Initialisation des services et actualisation...", { id: "wake-up-toast" });
    
    try {
      await handleRetry();
      toast.success("Services réveillés, données synchronisées", { id: "wake-up-toast" });
    } catch (e) {
      console.error("Error during wake-up sequence:", e);
      toast.error("Erreur pendant le réveil des services", { id: "wake-up-toast" });
    } finally {
      setIsWakingUpServices(false);
    }
  }, [handleRetry]);

  const handleClearCache = useCallback(async () => {
    toast.info("Nettoyage du cache en cours...");
    try {
      await resetCache();
      toast.success("Cache nettoyé, données rafraîchies");
    } catch (e) {
      console.error("Error clearing cache:", e);
      toast.error("Erreur pendant le nettoyage du cache");
    }
  }, [resetCache]);
  
  // Formater la date de dernière synchronisation
  const formatSyncDate = (date: Date | null | string) => {
    if (!date) return "Jamais";
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Date invalide";
    }
  };

  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p>Aucun compte actif trouvé.</p>
            <p className="text-sm text-muted-foreground mt-2">Activez au moins un compte Acelle Mail pour voir les statistiques.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Tableau de bord des campagnes</h2>
        <div className="flex flex-wrap gap-2">
          {syncError && (
            <Button
              onClick={handleWakeAndRefresh}
              disabled={isLoading || isWakingUpServices}
              variant="outline"
              className="border-amber-500 text-amber-500 hover:bg-amber-50"
            >
              {isWakingUpServices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réveil en cours...
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Réveiller les services
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isWakingUpServices}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </>
            )}
          </Button>
          <Button
            onClick={() => setIsDebugVisible(!isDebugVisible)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            title="Afficher/masquer les informations de diagnostic"
          >
            <Server className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nouvelle section: Informations de synchronisation */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex justify-between items-center">
            <span>État du cache et synchronisation</span>
            <Button
              onClick={forceSyncNow}
              disabled={isLoading || isWakingUpServices}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />} 
              Forcer la synchronisation
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Dernière synchronisation automatique:</p>
              <p className="font-medium">{formatSyncDate(syncStatus?.lastAutoSyncTime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Dernière synchronisation manuelle:</p>
              <p className="font-medium">{formatSyncDate(lastManualSync)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Campagnes en cache:</p>
              <p className="font-medium">{syncStatus?.cachedCampaignsCount || 0}</p>
            </div>
            
            {syncStatus?.lastSyncError && (
              <div className="col-span-full">
                <p className="text-red-600 mb-1">Dernière erreur de synchronisation:</p>
                <p className="font-medium text-red-600">{syncStatus.lastSyncError}</p>
              </div>
            )}
            
            {syncStatus?.lastSyncResult && (
              <div className="col-span-full">
                <p className={`${syncStatus.lastSyncResult.success ? 'text-green-600' : 'text-amber-600'} mb-1`}>
                  Résultat de la dernière synchronisation:
                </p>
                <p className="font-medium">{syncStatus.lastSyncResult.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {syncError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-1 items-center justify-between">
            <span>
              {syncError.includes("timeout") || syncError.includes("Failed to fetch") || syncError.includes("shutdown") || syncError.includes("API endpoint inaccessible") ? 
                "Les services semblent être arrêtés. Veuillez cliquer sur 'Réveiller les services'." : 
                syncError}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearCache} className="ml-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Vider le cache
              </Button>
              <Button variant="outline" size="sm" onClick={handleWakeAndRefresh} className="ml-2">
                <Power className="mr-2 h-4 w-4" />
                Réveiller
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isDebugVisible && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Informations de diagnostic</span>
              <Button variant="ghost" size="sm" onClick={() => setIsDebugVisible(false)}>Masquer</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auto-recovery" className="flex items-center space-x-2 mb-2">
                  <input
                    id="auto-recovery"
                    type="checkbox"
                    checked={autoRecoveryEnabled}
                    onChange={(e) => setAutoRecoveryEnabled(e.target.checked)}
                  />
                  <span>Récupération automatique</span>
                </Label>
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Tentatives de récupération: {recoveryAttempts}/{maxRecoveryAttempts}</p>
                  <p>État des services: {syncError ? "Indisponibles" : "Disponibles"}</p>
                  <p>Dernière erreur: {syncError || "Aucune"}</p>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Actions avancées:</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleWakeAndRefresh} disabled={isWakingUpServices}>
                    Forcer le réveil
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearCache}>
                    Vider le cache
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => forceSyncNow()}>
                    Forcer synchronisation
                  </Button>
                </div>
              </div>
            </div>
            
            {diagnosticInfo && (
              <Tabs defaultValue="general" className="mt-4">
                <TabsList>
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="requests">Requêtes</TabsTrigger>
                  <TabsTrigger value="responses">Réponses</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="max-h-48 overflow-auto">
                  <pre className="text-xs p-2 whitespace-pre-wrap bg-gray-100 rounded-md">
                    {JSON.stringify({
                      success: diagnosticInfo.success,
                      timestamp: diagnosticInfo.timestamp,
                      duration: diagnosticInfo.duration,
                      errorMessage: diagnosticInfo.errorMessage
                    }, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="requests" className="max-h-48 overflow-auto">
                  <pre className="text-xs p-2 whitespace-pre-wrap bg-gray-100 rounded-md">
                    {JSON.stringify(diagnosticInfo.request, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="responses" className="max-h-48 overflow-auto">
                  <pre className="text-xs p-2 whitespace-pre-wrap bg-gray-100 rounded-md">
                    {JSON.stringify(diagnosticInfo.response, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Connexion aux services Acelle en cours...</p>
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 mb-2">Erreur lors du chargement des données</p>
              <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : "Une erreur s'est produite"}</p>
              <div className="flex justify-center gap-3">
                <Button onClick={handleRefresh} className="mt-2" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                <Button onClick={handleWakeAndRefresh} className="mt-2" variant="default">
                  <Power className="mr-2 h-4 w-4" />
                  Réveiller les services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : campaignsData.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p>Aucune campagne trouvée.</p>
              <p className="text-sm text-muted-foreground mt-2">Créez votre première campagne ou vérifiez la connexion à l'API Acelle.</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Synchroniser les données
                </Button>
                <Button onClick={handleWakeAndRefresh} variant="default">
                  <Power className="mr-2 h-4 w-4" />
                  Réveiller les services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <CampaignSummaryStats campaigns={campaignsData} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CampaignStatusChart campaigns={campaignsData} />
            <DeliveryStatsChart campaigns={campaignsData} />
          </div>
        </>
      )}
    </div>
  );
}
