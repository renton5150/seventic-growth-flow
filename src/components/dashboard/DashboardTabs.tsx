
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/dashboard/requests-table";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredRequests: Request[];
  isAdmin?: boolean;
}

export const DashboardTabs = ({ activeTab, setActiveTab, filteredRequests, isAdmin = false }: DashboardTabsProps) => {
  const { user } = useAuth();
  
  // Couleurs en fonction du rôle
  const getRoleClass = () => {
    if (user?.role === "admin") return "border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100";
    if (user?.role === "growth") return "border-green-300 data-[state=active]:border-green-500 data-[state=active]:bg-green-100";
    return "border-seventic-300 data-[state=active]:border-seventic-500 data-[state=active]:bg-seventic-100";
  };

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center">
        <TabsList className={user?.role === "admin" ? "bg-blue-50" : user?.role === "growth" ? "bg-green-50" : "bg-seventic-50"}>
          <TabsTrigger value="all" className={getRoleClass()}>Toutes</TabsTrigger>
          <TabsTrigger value="email" className={getRoleClass()}>Emailing</TabsTrigger>
          <TabsTrigger value="database" className={getRoleClass()}>Bases de données</TabsTrigger>
          <TabsTrigger value="linkedin" className={getRoleClass()}>LinkedIn</TabsTrigger>
          <TabsTrigger value="pending" className={getRoleClass()}>En attente</TabsTrigger>
          <TabsTrigger value="late" className={getRoleClass()}>En retard</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="mt-4">
        <RequestsTable requests={filteredRequests} showSdr={isAdmin} />
      </TabsContent>
    </Tabs>
  );
};
