
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { toast } from "sonner";
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
    loading,
    error 
  } = useDashboardRequests();

  // Gérer les erreurs de chargement
  useEffect(() => {
    if (error) {
      console.error("Erreur lors du chargement des demandes:", error);
      toast.error("Erreur lors du chargement des demandes");
    }
  }, [error]);

  const handleRequestDeleted = async () => {
    console.log("Dashboard: demande de supprimée détectée, rechargement des données");
    try {
      await refetch();
      console.log("Dashboard: données rechargées avec succès");
    } catch (error) {
      console.error("Erreur lors du rechargement des données:", error);
      toast.error("Erreur lors du rechargement des données");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats requests={requests} />
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
          onRequestDeleted={handleRequestDeleted}
          isLoading={loading}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
