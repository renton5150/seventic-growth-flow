
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";

const Dashboard = () => {
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

  useEffect(() => {
    console.log("[DEBUG] Dashboard - Current state:", {
      activeTab,
      requestsCount: requests.length,
      filteredCount: filteredRequests.length
    });
  }, [activeTab, filteredRequests, requests]);

  const handleRequestDeleted = () => {
    refetch();
  };

  const handleFilterClick = (filterType: "all" | "pending" | "completed" | "late") => {
    handleStatCardClick(filterType);
    
    const filterMessages = {
      all: "Affichage de toutes les demandes",
      pending: "Filtrage par demandes en attente",
      completed: "Filtrage par demandes terminées",
      late: "Filtrage par demandes en retard"
    };
    
    toast.success(filterMessages[filterType]);
  };

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleFilterClick}
          activeTab={activeTab}
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
