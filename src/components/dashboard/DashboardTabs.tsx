
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { RequestsTable } from "./requests-table";
import { Request } from "@/types/types";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredRequests: Request[];
  isAdmin: boolean;
  onRequestDeleted?: () => void;
  isLoading?: boolean;
}

export const DashboardTabs = ({ 
  activeTab, 
  setActiveTab, 
  filteredRequests,
  isAdmin = false,
  onRequestDeleted,
  isLoading = false
}: DashboardTabsProps) => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  
  const handleNewRequest = () => {
    navigate("/requests/new");
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="all">
            Toutes
            <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              {isLoading ? '...' : filteredRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="email">Emailing</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="late">En retard</TabsTrigger>
        </TabsList>
        
        <Button onClick={handleNewRequest}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement des demandes...</span>
        </div>
      ) : (
        <TabsContent value={activeTab} className="space-y-4">
          <RequestsTable 
            requests={filteredRequests}
            showSdr={isAdmin}
            onRequestDeleted={onRequestDeleted}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};
