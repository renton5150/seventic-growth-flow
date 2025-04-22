
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardRequests } from "@/hooks/useDashboardRequests";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const queryClient = useQueryClient();
  
  const { 
    filteredRequests, 
    activeTab,
    setActiveTab, 
    isAdmin, 
    requests,
    refetch,
    handleStatCardClick
  } = useDashboardRequests();

  const handleRequestDeleted = () => {
    refetch();
  };

  // Force refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [queryClient]);

  const handleFilterClick = (filterType: "all" | "pending" | "inprogress" | "completed" | "late") => {
    console.log("[DEBUG] Dashboard - Filter clicked:", filterType);
    
    if (activeFilter === filterType) {
      setActiveFilter(null);
      setActiveTab("all");
      toast.success("Filtres réinitialisés");
    } else {
      setActiveFilter(filterType);
      setActiveTab(filterType);
      toast.success(`Filtrage par ${
        filterType === "all" ? "toutes les demandes" :
        filterType === "pending" ? "demandes en attente" :
        filterType === "inprogress" ? "demandes en cours" :
        filterType === "completed" ? "demandes terminées" :
        "demandes en retard"
      }`);
    }
  };

  // Log pour le débogage des permissions
  console.log("Dashboard - User Role:", user?.role, "isSDR:", isSDR, "Requests visible count:", filteredRequests?.length || 0);

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <DashboardHeader isSDR={isSDR} />
        <DashboardStats 
          requests={requests} 
          onStatClick={handleFilterClick}
          activeFilter={activeFilter}
        />
        <DashboardTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredRequests={filteredRequests}
          isAdmin={isAdmin}
          isSDR={isSDR}
          onRequestDeleted={handleRequestDeleted}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
