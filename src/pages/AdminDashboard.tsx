
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminStatsSummary } from "@/components/admin/AdminStatsSummary";
import { UserStatsTableNew } from "@/components/admin/UserStatsTableNew";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // Refresh data periodically
  useEffect(() => {
    // Initial data refresh
    refreshData();
    
    // Setup interval for periodic refresh
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [queryClient]);
  
  // Function to refresh all relevant data
  const refreshData = async () => {
    try {
      // Invalidate all admin-related queries
      await queryClient.invalidateQueries({ queryKey: ['admin-stats-summary'] });
      await queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      await queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Force explicit refetch
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['admin-stats-summary'] }),
        queryClient.refetchQueries({ queryKey: ['user-statistics'] }),
        queryClient.refetchQueries({ queryKey: ['growth-all-requests'] }),
        queryClient.refetchQueries({ queryKey: ['users'] })
      ]);
      
      console.log("Admin Dashboard - Data refreshed");
    } catch (error) {
      console.error("Error refreshing admin dashboard data:", error);
    }
  };
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        </div>
        
        <AdminStatsSummary />
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Statistiques par utilisateur</h2>
          <UserStatsTableNew />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
