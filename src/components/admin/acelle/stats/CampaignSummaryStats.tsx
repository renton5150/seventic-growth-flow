
import React, { useMemo } from "react";
import { AcelleCampaign } from "@/types/acelle.types";
import { Card } from "@/components/ui/card";

interface CampaignSummaryStatsProps {
  campaigns: AcelleCampaign[];
}

export const CampaignSummaryStats: React.FC<CampaignSummaryStatsProps> = ({ campaigns }) => {
  const stats = useMemo(() => {
    if (!campaigns.length) return null;
    
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    let totalEmails = 0;

    campaigns.forEach(campaign => {
      const info = campaign.delivery_info || {};
      
      totalEmails += info.total || 0;
      totalDelivered += info.delivered || 0;
      totalOpened += info.opened || 0;
      totalClicked += info.clicked || 0;
      totalBounced += (info.bounced?.total || 0);
    });

    const avgDeliveryRate = totalEmails > 0 ? totalDelivered / totalEmails * 100 : 0;
    const avgOpenRate = totalDelivered > 0 ? totalOpened / totalDelivered * 100 : 0;
    const avgClickRate = totalDelivered > 0 ? totalClicked / totalDelivered * 100 : 0;
    
    return {
      totalCampaigns: campaigns.length,
      totalEmails,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      avgDeliveryRate: avgDeliveryRate.toFixed(1),
      avgOpenRate: avgOpenRate.toFixed(1),
      avgClickRate: avgClickRate.toFixed(1)
    };
  }, [campaigns]);
  
  if (!stats) {
    return <div>Chargement des statistiques...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Campagnes</p>
        <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Emails envoyés</p>
        <p className="text-2xl font-bold">{stats.totalEmails}</p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Taux moyen d'ouverture</p>
        <p className="text-2xl font-bold">{stats.avgOpenRate}%</p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Taux moyen de clic</p>
        <p className="text-2xl font-bold">{stats.avgClickRate}%</p>
      </div>
    </div>
  );
};
