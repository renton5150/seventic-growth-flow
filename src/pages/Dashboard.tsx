
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useEffect } from "react";

const Dashboard = () => {
  const { 
    filteredRequests, 
    activeTab, 
    setActiveTab, 
    isSDR, 
    isAdmin, 
    requests,
    refetch,
    handleStatCardClick // Récupération directe de la fonction de gestion des clics
  } = useDashboardRequests();

  // Log pour le débogage
  useEffect(() => {
    console.log("Dashboard - activeTab changed:", activeTab);
    console.log("Dashboard - filteredRequests count:", filteredRequests.length);
  }, [activeTab, filteredRequests]);

  const handleRequestDeleted = () => {
    // Recharger les données après suppression
    refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleStatCardClick} // Utilisation directe de la fonction du hook
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
