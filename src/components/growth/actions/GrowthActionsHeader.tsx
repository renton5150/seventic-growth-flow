
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

interface GrowthActionsHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRequests: number;
}

export const GrowthActionsHeader = ({ activeTab, setActiveTab, totalRequests }: GrowthActionsHeaderProps) => {
  const { user } = useAuth();
  const isGrowth = user?.role === 'growth';
  const isSDR = user?.role === 'sdr';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Gestion des demandes ({totalRequests})
        </h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            {isGrowth ? "Vue complète" : "Toutes"}
          </TabsTrigger>
          <TabsTrigger value="to_assign">
            Non assignées
          </TabsTrigger>
          <TabsTrigger value="my_assignments">
            {isSDR ? "Mes demandes" : isGrowth ? "Mes assignations" : "Assignées"}
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            En cours
          </TabsTrigger>
          <TabsTrigger value="email">
            Email
          </TabsTrigger>
          <TabsTrigger value="database">
            Database
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          {isGrowth && activeTab === "all" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Vue complète :</strong> Toutes les demandes non assignées + vos demandes assignées
              </p>
            </div>
          )}
          {activeTab === "to_assign" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-700">
                <strong>Non assignées :</strong> Demandes en attente d'assignation
              </p>
            </div>
          )}
          {activeTab === "my_assignments" && isGrowth && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                <strong>Mes assignations :</strong> Demandes qui vous sont spécifiquement assignées
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
