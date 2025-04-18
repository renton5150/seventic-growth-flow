
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { 
    filteredRequests, 
    activeTab,
    setActiveTab, 
    isSDR, 
    isAdmin, 
    requests,
    refetch,
    handleStatCardClick
  } = useDashboardRequests();

  const handleRequestDeleted = () => {
    refetch();
  };

  const handleFilterClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("[DEBUG] Dashboard - Filter clicked:", filterType);
    
    if (activeFilter === filterType) {
      console.log("[DEBUG] Dashboard - Resetting filter (was already active)");
      setActiveFilter(null);
      setActiveTab("all");
      toast.success("Filtres réinitialisés");
    } else {
      console.log("[DEBUG] Dashboard - Setting new filter:", filterType);
      setActiveFilter(filterType);
      setActiveTab(filterType);
      toast.success(`Filtrage par ${
        filterType === "all" ? "toutes les demandes" :
        filterType === "pending" ? "demandes en attente" :
        filterType === "completed" ? "demandes terminées" :
        "demandes en retard"
      }`);
    }
  };

  // Log whenever activeTab changes
  useEffect(() => {
    console.log("[DEBUG] Dashboard - Active tab changed to:", activeTab);
  }, [activeTab]);

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleStatCardClick || handleFilterClick}
          activeFilter={activeFilter}
        />
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
          onRequestDeleted={handleRequestDeleted}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
