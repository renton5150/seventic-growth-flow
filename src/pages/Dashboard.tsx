
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { StatFilter } from "@/components/admin/AdminStatsSummary";
import { toast } from "sonner";

const Dashboard = () => {
  const [statFilter, setStatFilter] = useState<StatFilter>("all");
  const { requests, filteredRequests, activeTab, setActiveTab, isAdmin } = useDashboardRequests();

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
        <DashboardHeader />
        <DashboardStats 
          requests={requests}
          onFilterChange={handleFilterChange}
          currentFilter={statFilter} 
        />
        <DashboardTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
