
import { AppLayout } from "@/components/layout/AppLayout";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { useEffect } from "react";
import { GrowthDashboardHeader } from "@/components/growth/dashboard/GrowthDashboardHeader";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";
import { useQueryClient } from "@tanstack/react-query";

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
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
      queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
      console.log("Growth Dashboard - Automatic refresh triggered");
    }, 3000); // Refresh every 3 seconds for better reactivity
    
    return () => clearInterval(interval);
  }, [queryClient]);

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
