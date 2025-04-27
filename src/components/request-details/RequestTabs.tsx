
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailCampaignDetails } from "./email-campaign/EmailCampaignDetails";
import { Request } from "@/types/types";
import { RequestDetailsCard } from "./RequestDetailsCard";
import { RequestTargeting } from "./RequestTargeting";
import { RequestTimeline } from "./RequestTimeline";
import { RequestResults } from "./RequestResults";

export interface RequestTabsProps {
  request: Request;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({ request }) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="targeting">Ciblage</TabsTrigger>
        <TabsTrigger value="timeline">Chronologie</TabsTrigger>
        <TabsTrigger value="results">Résultats</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <RequestDetailsCard request={request} />
      </TabsContent>
      
      <TabsContent value="targeting">
        <RequestTargeting request={request} />
      </TabsContent>
      
      <TabsContent value="timeline">
        <RequestTimeline request={request} />
      </TabsContent>
      
      <TabsContent value="results">
        <RequestResults request={request} />
      </TabsContent>
    </Tabs>
  );
};
