
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Request } from "@/types/types";
import EmailCampaignDetails from "@/components/requests/email-campaign/EmailCampaignDetails";
import { RequestDetailsCard } from "./RequestDetailsCard";
import { RequestTargeting } from "./RequestTargeting";
import { RequestTimeline } from "./RequestTimeline";
import { RequestResults } from "./RequestResults";

interface RequestTabsProps {
  request: Request;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({ request }) => {
  return (
    <Tabs defaultValue="details" className="mt-6">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="targeting">Ciblage</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="results">Résultats</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="mt-4 space-y-4">
        <RequestDetailsCard request={request} />
      </TabsContent>
      <TabsContent value="targeting" className="mt-4">
        <RequestTargeting request={request} />
      </TabsContent>
      <TabsContent value="timeline" className="mt-4">
        <RequestTimeline request={request} />
      </TabsContent>
      <TabsContent value="results" className="mt-4">
        <RequestResults request={request} />
      </TabsContent>
    </Tabs>
  );
};
