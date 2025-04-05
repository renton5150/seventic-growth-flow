
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/dashboard/requests-table";
import { Request } from "@/types/types";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredRequests: Request[];
}

export const DashboardTabs = ({ activeTab, setActiveTab, filteredRequests }: DashboardTabsProps) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="email">Emailing</TabsTrigger>
          <TabsTrigger value="database">Bases de données</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="late">En retard</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="mt-4">
        <RequestsTable requests={filteredRequests} />
      </TabsContent>
    </Tabs>
  );
};
