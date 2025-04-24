
import React, { useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcelleAccount } from "@/types/acelle.types";
import { useAcelleCampaigns } from "@/hooks/acelle/useAcelleCampaigns";
import { CampaignStatusChart } from "./charts/CampaignStatusChart";
import { DeliveryStatsChart } from "./charts/DeliveryStatsChart";
import { CampaignSummaryStats } from "./stats/CampaignSummaryStats";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const { activeAccounts, campaignsData, isLoading, isError, refetch } = useAcelleCampaigns(accounts);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-red-500">Erreur lors du chargement des données</p>
              <p className="text-sm text-muted-foreground mt-2">Veuillez réessayer plus tard.</p>
              <Button onClick={handleRefresh} className="mt-4" variant="outline">Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      ) : campaignsData.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p>Aucune campagne trouvée.</p>
              <p className="text-sm text-muted-foreground mt-2">Créez votre première campagne ou attendez la synchronisation.</p>
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
