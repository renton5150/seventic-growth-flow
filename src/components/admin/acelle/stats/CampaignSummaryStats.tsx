
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { calculateDeliveryStats } from "@/utils/acelle/campaignStats";

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats = ({ campaigns }: CampaignSummaryStatsProps) => {
  // Calculer les statistiques de livraison
  const statsArray = calculateDeliveryStats(campaigns);
  
  // Extraire les valeurs du tableau retourné par calculateDeliveryStats
  const findStatValue = (name: string): number => {
    const stat = statsArray.find(item => item.name === name);
    return stat ? stat.value : 0;
  };
  
  const totalEmails = findStatValue("Envoyés");
  const deliveredEmails = findStatValue("Livrés");
  const openedEmails = findStatValue("Ouverts");
  const clickedEmails = findStatValue("Cliqués");
  
  const formatRate = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

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
              {formatRate(openedEmails, deliveredEmails)}
            </p>
            <p className="text-muted-foreground">Taux d'ouverture</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{clickedEmails}</p>
            <p className="text-sm text-muted-foreground">
              {formatRate(clickedEmails, deliveredEmails)}
            </p>
            <p className="text-muted-foreground">Taux de clic</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
