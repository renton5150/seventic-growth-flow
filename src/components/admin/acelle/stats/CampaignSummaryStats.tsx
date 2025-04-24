
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { calculateDeliveryStats } from "@/utils/acelle/campaignStats";

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats = ({ campaigns }: CampaignSummaryStatsProps) => {
  const deliveryStats = calculateDeliveryStats(campaigns);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{campaigns.length}</p>
            <p className="text-muted-foreground">Campagnes</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{deliveryStats[0].value}</p>
            <p className="text-muted-foreground">Emails envoyés</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">
              {deliveryStats[1].value} / {deliveryStats[0].value > 0 
                ? `${((deliveryStats[1].value / deliveryStats[0].value) * 100).toFixed(1)}%`
                : "0%"}
            </p>
            <p className="text-muted-foreground">Taux d'ouverture</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">
              {deliveryStats[2].value} / {deliveryStats[0].value > 0 
                ? `${((deliveryStats[2].value / deliveryStats[0].value) * 100).toFixed(1)}%`
                : "0%"}
            </p>
            <p className="text-muted-foreground">Taux de clic</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
