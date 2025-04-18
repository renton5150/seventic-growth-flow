
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
    handleStatCardClick
  } = useDashboardRequests();

  // Log pour le débogage avec meilleure visibilité
  useEffect(() => {
    console.log("[DEBUG] Dashboard - activeTab changed:", activeTab);
    console.log("[DEBUG] Dashboard - filteredRequests count:", filteredRequests.length);
  }, [activeTab, filteredRequests]);

  const handleRequestDeleted = () => {
    // Recharger les données après suppression
    refetch();
  };

  // Solution radicale: Implémentation directe qui force la mise à jour
  const handleStatClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("[RADICAL FIX] Dashboard - StatCard clicked:", filterType);
    
    // Appel direct à la fonction du hook
    handleStatCardClick(filterType);
    
    // Force l'onglet actif à changer de manière synchrone
    setActiveTab(filterType);
    
    console.log("[RADICAL FIX] Dashboard - Tab set to:", filterType);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleStatClick}
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
