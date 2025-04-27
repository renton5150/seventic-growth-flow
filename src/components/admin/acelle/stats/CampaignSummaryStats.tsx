
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { calculateDeliveryStats } from "@/utils/acelle/campaignStats";

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats = ({ campaigns }: CampaignSummaryStatsProps) => {
  const deliveryStats = calculateDeliveryStats(campaigns);
  
  // Extraction des valeurs pour une meilleure lisibilité
  const totalEmails = deliveryStats[0]?.value || 0;
  const openedEmails = deliveryStats[1]?.value || 0;
  const clickedEmails = deliveryStats[2]?.value || 0;
  
  const formatRate = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  console.log("CampaignSummaryStats - deliveryStats:", deliveryStats);
  console.log("CampaignSummaryStats - campaigns count:", campaigns.length);
  console.log("CampaignSummaryStats - sample campaign data:", campaigns[0]?.delivery_info);

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
            <p className="text-2xl font-bold">{totalEmails}</p>
            <p className="text-muted-foreground">Emails envoyés</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{openedEmails}</p>
            <p className="text-sm text-muted-foreground">
              {formatRate(openedEmails, totalEmails)}
            </p>
            <p className="text-muted-foreground">Taux d'ouverture</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{clickedEmails}</p>
            <p className="text-sm text-muted-foreground">
              {formatRate(clickedEmails, totalEmails)}
            </p>
            <p className="text-muted-foreground">Taux de clic</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
