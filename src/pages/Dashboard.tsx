
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useDirectRequests } from "@/hooks/useDirectRequests";
import { DirectRequestsTable } from "@/components/growth/table/DirectRequestsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const {
    filteredRequests,
    activeTab,
    setActiveTab,
    isSDR,
    isGrowth,
    isAdmin,
    loading,
    refetch,
    handleStatCardClick,
    filterParams,
    requests // Utiliser toutes les requests pour les stats
  } = useDashboardRequests();

  // SOLUTION DIRECTE - récupération directe des demandes
  const { data: directRequests = [], isLoading: directLoading, error: directError } = useDirectRequests();

  console.log("🔍 [DASHBOARD] Comparaison des systèmes:");
  console.log("  - Système actuel (filteredRequests):", filteredRequests.length);
  console.log("  - Système direct (directRequests):", directRequests.length);

  if (loading || directLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader 
          isSDR={isSDR} 
          isGrowth={isGrowth} 
          isAdmin={isAdmin}
          filterParams={filterParams}
        />

        {/* DIAGNOSTIC IMMÉDIAT */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-900 font-semibold">
            🔍 DIAGNOSTIC COMPLET - Comparaison des systèmes
          </div>
          <div className="text-yellow-700 text-sm mt-2 space-y-1">
            <div><strong>Système actuel (requests):</strong> {requests.length} demandes totales</div>
            <div><strong>Système actuel (filteredRequests):</strong> {filteredRequests.length} demandes filtrées</div>
            <div><strong>Système DIRECT:</strong> {directRequests.length} demandes</div>
            <div><strong>Direct Error:</strong> {directError ? 'OUI' : 'NON'}</div>
            <div><strong>Active Tab:</strong> {activeTab}</div>
          </div>
        </div>
        
        <DashboardStats 
          requests={requests} // Utiliser toutes les requests pour calculer les stats correctement
          onStatClick={handleStatCardClick}
          activeFilter={activeTab}
        />

        {/* ONGLETS POUR COMPARER LES DEUX SYSTÈMES */}
        <Tabs defaultValue="direct" className="space-y-4">
          <TabsList className="grid grid-cols-2 h-auto p-1">
            <TabsTrigger value="direct" className="py-2">
              🚀 Système DIRECT ({directRequests.length})
            </TabsTrigger>
            <TabsTrigger value="current" className="py-2">
              ⚙️ Système actuel ({filteredRequests.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="mt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Système DIRECT:</strong> Récupération directe depuis la table 'requests' - {directRequests.length} demande(s)
                </div>
              </div>
              <DirectRequestsTable requests={directRequests} />
            </div>
          </TabsContent>
          
          <TabsContent value="current" className="mt-6">
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm text-orange-800">
                  <strong>Système actuel:</strong> Via le pipeline complexe - {filteredRequests.length} demande(s)
                </div>
              </div>
              <DashboardTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                filteredRequests={filteredRequests}
                isAdmin={isAdmin}
                isSDR={isSDR}
                onRequestDeleted={refetch}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
