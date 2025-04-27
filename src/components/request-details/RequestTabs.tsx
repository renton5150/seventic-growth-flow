
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Request } from "@/types/types";
import { RequestDetailsCard } from "./RequestDetailsCard";
import { RequestTargeting } from "./RequestTargeting";
import { RequestTimeline } from "./RequestTimeline";
import { RequestResults } from "./RequestResults";

export interface RequestTabsProps {
  request: Request;
}

export const RequestTabs = ({ request }: RequestTabsProps) => {
  return (
    <Tabs defaultValue="details">
      <TabsList className="grid grid-cols-4 mb-6">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="targeting">Ciblage</TabsTrigger>
        <TabsTrigger value="results">Résultats</TabsTrigger>
        <TabsTrigger value="timeline">Historique</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <RequestDetailsCard request={request} />
      </TabsContent>
      
      <TabsContent value="targeting">
        <RequestTargeting request={request} />
      </TabsContent>
      
      <TabsContent value="results">
        <RequestResults request={request} />
      </TabsContent>
      
      <TabsContent value="timeline">
        <RequestTimeline request={request} />
      </TabsContent>
    </Tabs>
  );
};
