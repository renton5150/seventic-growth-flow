
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

  // Gestionnaire de clic sur les cartes qui force la mise à jour de l'onglet actif
  const handleStatClick = (filterType: "all" | "pending" | "completed" | "late") => {
    console.log("[DEBUG] Dashboard - StatCard clicked, setting tab to:", filterType);
    handleStatCardClick(filterType);
    
    // Forcer la mise à jour de l'interface utilisateur
    setTimeout(() => {
      console.log("[DEBUG] Dashboard - Tab should now be:", filterType);
    }, 100);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleStatClick}
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
