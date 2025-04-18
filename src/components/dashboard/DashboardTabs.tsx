
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RequestsTable } from "./requests-table";
import { Request } from "@/types/types";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Mail, Database, User } from "lucide-react";
import { useEffect } from "react";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredRequests: Request[];
  isAdmin: boolean;
  onRequestDeleted?: () => void;
}

export const DashboardTabs = ({ 
  activeTab, 
  setActiveTab, 
  filteredRequests,
  isAdmin = false,
  onRequestDeleted
}: DashboardTabsProps) => {
  const navigate = useNavigate();
  
  // Log pour le débogage
  useEffect(() => {
    console.log("DashboardTabs - activeTab:", activeTab);
    console.log("DashboardTabs - filteredRequests:", filteredRequests);
  }, [activeTab, filteredRequests]);
  
  const handleCreateRequest = (type: string) => {
    switch (type) {
      case "email":
        navigate("/requests/email/new");
        break;
      case "database":
        navigate("/requests/database/new");
        break;
      case "linkedin":
        navigate("/requests/linkedin/new");
        break;
      default:
        break;
    }
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
            Toutes
            <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              {filteredRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>En attente</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setActiveTab("completed")}>Terminées</TabsTrigger>
          <TabsTrigger value="late" onClick={() => setActiveTab("late")}>En retard</TabsTrigger>
          <TabsTrigger value="email" onClick={() => setActiveTab("email")}>Email</TabsTrigger>
          <TabsTrigger value="database" onClick={() => setActiveTab("database")}>Database</TabsTrigger>
          <TabsTrigger value="linkedin" onClick={() => setActiveTab("linkedin")}>LinkedIn</TabsTrigger>
        </TabsList>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border rounded-md shadow-md z-50 min-w-[200px]">
            <DropdownMenuItem onSelect={() => handleCreateRequest("email")} className="cursor-pointer">
              <Mail className="mr-2 h-4 w-4" /> Campagne Email
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCreateRequest("database")} className="cursor-pointer">
              <Database className="mr-2 h-4 w-4" /> Base de données
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCreateRequest("linkedin")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Scraping LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <TabsContent value={activeTab} className="space-y-4">
        <RequestsTable 
          requests={filteredRequests}
          showSdr={isAdmin}
          onRequestDeleted={onRequestDeleted}
        />
      </TabsContent>
    </Tabs>
  );
};
