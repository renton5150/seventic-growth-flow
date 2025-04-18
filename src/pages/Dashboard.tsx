
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useEffect } from "react";
import { Toaster } from "sonner";

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

  // Log pour le débogage avec meilleure visibilité
  useEffect(() => {
    console.log("[ULTRA FIX] Dashboard - État actuel:", {
      activeTab,
      requestsCount: requests.length,
      filteredCount: filteredRequests.length
    });
  }, [activeTab, filteredRequests, requests]);

  const handleRequestDeleted = () => {
    // Recharger les données après suppression
    refetch();
  };

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleStatCardClick}
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
