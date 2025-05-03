
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats = ({ campaigns }: CampaignSummaryStatsProps) => {
  useEffect(() => {
    console.log(`[CampaignSummaryStats] Rendu avec ${campaigns.length} campagnes`);
  }, [campaigns]);
  
  // Calculer directement les statistiques à partir des campagnes
  const calculateStats = () => {
    let totalEmails = 0;
    let deliveredEmails = 0;
    let openedEmails = 0;
    let clickedEmails = 0;
    
    campaigns.forEach(campaign => {
      // Utiliser soit statistics, soit delivery_info selon ce qui est disponible
      if (campaign.statistics) {
        totalEmails += campaign.statistics.subscriber_count || 0;
        deliveredEmails += campaign.statistics.delivered_count || 0;
        openedEmails += campaign.statistics.open_count || 0;
        clickedEmails += campaign.statistics.click_count || 0;
      } else if (campaign.delivery_info) {
        totalEmails += campaign.delivery_info.total || 0;
        deliveredEmails += campaign.delivery_info.delivered || 0;
        openedEmails += campaign.delivery_info.opened || 0;
        clickedEmails += campaign.delivery_info.clicked || 0;
      }
    });
    
    console.log(`[CampaignSummaryStats] Stats calculées: total=${totalEmails}, delivered=${deliveredEmails}, opened=${openedEmails}, clicked=${clickedEmails}`);
    
    return {
      totalEmails,
      deliveredEmails,
      openedEmails,
      clickedEmails
    };
  };
  
  const stats = calculateStats();
  
  // Calculer les taux
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
            <p className="text-2xl font-bold">{stats.totalEmails}</p>
            <p className="text-muted-foreground">Emails envoyés</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{stats.openedEmails}</p>
            <p className="text-sm text-muted-foreground">
              {formatRate(stats.openedEmails, stats.deliveredEmails)}
            </p>
            <p className="text-muted-foreground">Taux d'ouverture</p>
          </div>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-2xl font-bold">{stats.clickedEmails}</p>
            <p className="text-sm text-muted-foreground">
              {formatRate(stats.clickedEmails, stats.deliveredEmails)}
            </p>
            <p className="text-muted-foreground">Taux de clic</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
