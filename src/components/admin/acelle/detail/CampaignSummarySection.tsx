
import React from "react";
import { AcelleCampaign } from "@/types/acelle.types";
import { CampaignGeneralInfo } from "./CampaignGeneralInfo";
import { CampaignGlobalStats } from "./CampaignGlobalStats";
import { Card } from "@/components/ui/card";

interface CampaignSummarySectionProps {
  campaign: AcelleCampaign;
  noStatsAvailable: boolean;
}

export const CampaignSummarySection = ({
  campaign,
  noStatsAvailable
}: CampaignSummarySectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CampaignGeneralInfo campaign={campaign} />
      {!noStatsAvailable ? (
        <CampaignGlobalStats statistics={campaign.statistics} />
      ) : (
        <Card className="p-4 flex items-center justify-center h-full">
          <p className="text-gray-500">Aucune statistique disponible</p>
        </Card>
      )}
    </div>
  );
};
