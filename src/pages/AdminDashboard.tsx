
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminStatsSummary, StatFilter } from "@/components/admin/AdminStatsSummary";
import { UserStatsTable } from "@/components/admin/UserStatsTable";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [statFilter, setStatFilter] = useState<StatFilter>("all");
  const { requests, filteredRequests, loading, setActiveTab } = useDashboardRequests();
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  const handleFilterChange = (filter: StatFilter) => {
    setStatFilter(filter);
    
    // Mettre à jour le tableau en fonction du filtre sélectionné
    switch (filter) {
      case "all":
        setActiveTab("all");
        toast.info("Affichage de toutes les demandes");
        break;
      case "pending":
        setActiveTab("pending");
        toast.info("Affichage des demandes en attente");
        break;
      case "completed":
        setActiveTab("completed");
        toast.info("Affichage des demandes terminées");
        break;
      case "late":
        setActiveTab("late");
        toast.info("Affichage des demandes en retard");
        break;
    }
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        </div>
        
        <AdminStatsSummary 
          onFilterChange={handleFilterChange}
          currentFilter={statFilter}
        />
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Statistiques par utilisateur</h2>
          <UserStatsTable />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Demandes</h2>
          <DashboardTabs 
            activeTab={statFilter === "all" ? "all" : 
                      statFilter === "pending" ? "pending" : 
                      statFilter === "completed" ? "completed" : 
                      "late"} 
            setActiveTab={(tab) => handleFilterChange(tab as StatFilter)}
            filteredRequests={filteredRequests}
            isAdmin={true}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
