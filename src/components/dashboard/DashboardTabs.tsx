
import { Request } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "./requests-table/RequestsTable";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  filteredRequests: Request[];
  isAdmin: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}

export const DashboardTabs = ({
  activeTab,
  setActiveTab,
  filteredRequests,
  isAdmin,
  isSDR = false,
  onRequestDeleted
}: DashboardTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-5 h-auto p-1">
        <TabsTrigger value="all" className="py-2">
          Toutes
        </TabsTrigger>
        <TabsTrigger value="pending" className="py-2">
          En attente
        </TabsTrigger>
        <TabsTrigger value="inprogress" className="py-2">
          En cours
        </TabsTrigger>
        <TabsTrigger value="completed" className="py-2">
          Terminées
        </TabsTrigger>
        <TabsTrigger value="late" className="py-2">
          En retard
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-6">
        <RequestsTable 
          requests={filteredRequests} 
          showSdr={!isSDR}
          isSDR={isSDR}
          onRequestDeleted={onRequestDeleted}
        />
      </TabsContent>
    </Tabs>
  );
};
