
import React, { useCallback, useEffect } from "react";
import { Loader2, RefreshCw, AlertTriangle, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AcelleAccount } from "@/types/acelle.types";
import { useAcelleCampaigns } from "@/hooks/acelle/useAcelleCampaigns";
import { CampaignStatusChart } from "./charts/CampaignStatusChart";
import { DeliveryStatsChart } from "./charts/DeliveryStatsChart";
import { CampaignSummaryStats } from "./stats/CampaignSummaryStats";
import { toast } from "sonner";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const { 
    activeAccounts, 
    campaignsData, 
    isLoading, 
    isError, 
    error, 
    syncError, 
    refetch, 
    handleRetry 
  } = useAcelleCampaigns(accounts);

  // Recovery mechanism - if error detected, try to recover automatically
  useEffect(() => {
    if (syncError && (syncError.includes("Failed to fetch") || syncError.includes("timeout") || syncError.includes("shutdown"))) {
      // Schedule automatic recovery attempt after error detected
      const timer = setTimeout(() => {
        console.log("Tentative de récupération automatique après erreur détectée");
        toast.info("Tentative de récupération automatique...");
        handleRetry();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [syncError, handleRetry]);

  const handleRefresh = useCallback(() => {
    toast.info("Actualisation des données en cours...");
    refetch();
  }, [refetch]);

  const handleWakeAndRefresh = useCallback(() => {
    toast.info("Initialisation des services et actualisation...");
    handleRetry();
  }, [handleRetry]);

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tableau de bord des campagnes</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleWakeAndRefresh}
            disabled={isLoading}
            variant="outline"
            className="border-amber-500 text-amber-500 hover:bg-amber-50"
          >
            <Power className="mr-2 h-4 w-4" />
            Réveiller les services
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
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
        </div>
      </div>

      {syncError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-1 items-center justify-between">
            <span>
              {syncError.includes("timeout") || syncError.includes("Failed to fetch") ? 
                "Les services semblent être en cours de démarrage. Veuillez patienter ou cliquer sur 'Réveiller les services'." : 
                syncError}
            </span>
            <Button variant="outline" size="sm" onClick={handleWakeAndRefresh} className="ml-2">
              <Power className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
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
