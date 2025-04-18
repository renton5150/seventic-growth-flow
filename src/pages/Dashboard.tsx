
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { Toaster } from "sonner";

const Dashboard = () => {
  const { 
    requests,
    isAdmin,
    refetch
  } = useDashboardRequests();

  console.log('Dashboard rendering with requests:', requests);

  const handleRequestDeleted = () => {
    refetch();
  };

  const handleFilterChange = (filterType: string | null) => {
    console.log("Filter changed in Dashboard to:", filterType);
    // La logique de filtrage est déjà gérée dans DashboardContent
  };

  return (
    <AppLayout>
      {/* TEST VISUEL EXPLICITE - DOIT ÊTRE VISIBLE */}
      <div className="bg-red-500 p-4 mb-4 rounded-lg">
        <h2 className="text-white font-bold text-xl">TEST VISUEL - SI VOUS VOYEZ CECI, LE RENDU FONCTIONNE</h2>
        <p className="text-white">Nombre de requêtes: {requests?.length || 0}</p>
      </div>

      <Toaster position="top-center" />
      <DashboardContent
        requests={requests}
        isAdmin={isAdmin}
        onRequestDeleted={handleRequestDeleted}
        onFilterChange={handleFilterChange}
      />
    </AppLayout>
  );
};

export default Dashboard;
