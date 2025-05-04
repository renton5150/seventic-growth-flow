
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleCampaign } from "@/types/acelle.types";
import { CampaignStatistics } from "../stats/CampaignStatistics";
import { CampaignTechnicalInfo } from "./CampaignTechnicalInfo";

interface CampaignDetailTabsProps {
  campaign: AcelleCampaign;
  noStatsAvailable: boolean;
}

export const CampaignDetailTabs = ({
  campaign,
  noStatsAvailable
}: CampaignDetailTabsProps) => {
  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
        <TabsTrigger value="links">Liens et clics</TabsTrigger>
        <TabsTrigger value="technical">Informations techniques</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4 py-4">
        {!noStatsAvailable ? (
          <CampaignStatistics statistics={campaign.statistics} />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Les statistiques détaillées ne sont pas disponibles pour cette campagne.</p>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="links" className="py-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              Les données détaillées sur les clics ne sont pas disponibles pour le moment.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="technical" className="py-4">
        <CampaignTechnicalInfo 
          campaign={campaign} 
          noStatsAvailable={noStatsAvailable}
        />
      </TabsContent>
    </Tabs>
  );
};
