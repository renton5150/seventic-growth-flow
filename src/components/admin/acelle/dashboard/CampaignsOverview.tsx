
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import CampaignStatusChart from "../charts/CampaignStatusChart";
import DeliveryStatsChart from "../charts/DeliveryStatsChart";
import CampaignSummaryStats from "../stats/CampaignSummaryStats";

interface CampaignsOverviewProps {
  campaigns: AcelleCampaign[];
  accounts: AcelleAccount[];
}

const CampaignsOverview: React.FC<CampaignsOverviewProps> = ({ campaigns, accounts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Statistiques des campagnes</h3>
          <CampaignSummaryStats campaigns={campaigns} />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Statut des campagnes</h3>
          <div className="h-64">
            <CampaignStatusChart campaigns={campaigns} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Performance des envois</h3>
          <div className="h-64">
            <DeliveryStatsChart campaigns={campaigns} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsOverview;
