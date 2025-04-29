
import { AppLayout } from "@/components/layout/AppLayout";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { useEffect } from "react";
import { GrowthDashboardHeader } from "@/components/growth/dashboard/GrowthDashboardHeader";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const queryClient = useQueryClient();
  const {
    filteredRequests,
    allRequests,
    activeTab,
    setActiveTab,
    selectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleViewDetails,
    handleRequestUpdated,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    handleStatCardClick,
    activeFilter,
    setActiveFilter
  } = useGrowthDashboard(defaultTab);

  // Assure que le tableau de bord revienne par défaut sur "Toutes"
  useEffect(() => {
    if (!defaultTab && activeTab !== "all") {
      setActiveTab("all");
    }
  }, [defaultTab, activeTab, setActiveTab]);

  // Force refresh data more frequently for better real-time updates
  useEffect(() => {
    // Initial fetch when component mounts
    const initialRefresh = async () => {
      await forceRefreshAllData();
      console.log("Growth Dashboard - Initial refresh triggered");
    };
    
    initialRefresh();
    
    // Set up the interval for regular refreshes
    const interval = setInterval(async () => {
      await forceRefreshAllData();
      console.log("Growth Dashboard - Automatic refresh triggered");
    }, 5000); // Refresh every 5 seconds for better reactivity
    
    return () => clearInterval(interval);
  }, [queryClient]);
  
  // Fonction pour forcer le rafraîchissement de toutes les données pertinentes
  const forceRefreshAllData = async () => {
    try {
      console.log("Invalidating and refreshing all request queries...");
      
      await queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
      await queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
      
      // Forcer un refetch explicite après l'invalidation
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['growth-all-requests'] }),
        queryClient.refetchQueries({ queryKey: ['growth-requests-to-assign'] }),
        queryClient.refetchQueries({ queryKey: ['growth-requests-my-assignments'] }),
        queryClient.refetchQueries({ queryKey: ['dashboard-requests-with-missions'] })
      ]);
      
      console.log("All request queries refreshed successfully");
    } catch (error) {
      console.error("Erreur lors du refetch des données:", error);
    }
  };
  
  // Handler for when a request is deleted
  const handleRequestDeleted = async () => {
    console.log("Request deleted callback triggered, refreshing data...");
    toast.success("Liste des demandes mise à jour");
    
    // Force refresh of all relevant queries immediately 
    await forceRefreshAllData();
    
    // Schedule another refresh after a short delay to ensure consistency
    setTimeout(() => {
      forceRefreshAllData();
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <GrowthDashboardHeader totalRequests={allRequests.length} />
        
        <GrowthDashboardContent
          allRequests={allRequests}
          filteredRequests={filteredRequests}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEditRequest={handleOpenEditDialog}
          onCompleteRequest={handleOpenCompletionDialog}
          onViewDetails={handleViewDetails}
          onRequestUpdated={handleRequestUpdated}
          onRequestDeleted={handleRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          handleStatCardClick={handleStatCardClick}
        />
      </div>
      
      <RequestEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedRequest={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
      />
      
      <RequestCompletionDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
        selectedRequest={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
      />
    </AppLayout>
  );
};

export default GrowthDashboard;
