
import React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleAccount } from "@/types/acelle.types";
import { useAcelleCampaigns } from "@/hooks/acelle/useAcelleCampaigns";
import { CampaignStatusChart } from "./charts/CampaignStatusChart";
import { DeliveryStatsChart } from "./charts/DeliveryStatsChart";
import { CampaignSummaryStats } from "./stats/CampaignSummaryStats";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const { activeAccounts, campaignsData, isLoading, isError } = useAcelleCampaigns(accounts);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-red-500">Erreur lors du chargement des données</p>
            <p className="text-sm text-muted-foreground mt-2">Veuillez réessayer plus tard.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CampaignStatusChart campaigns={campaignsData} />
        <DeliveryStatsChart campaigns={campaignsData} />
      </div>
      <CampaignSummaryStats campaigns={campaignsData} />
    </div>
  );
}
