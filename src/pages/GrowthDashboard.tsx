
import { AppLayout } from "@/components/layout/AppLayout";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { useEffect } from "react";
import { GrowthDashboardHeader } from "@/components/growth/dashboard/GrowthDashboardHeader";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";
import { Toaster } from "sonner";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const {
    filteredRequests,
    allRequests,
    activeTab,
    activeFilter,
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
    handleStatCardClick
  } = useGrowthDashboard(defaultTab);

  // Assure que le tableau de bord revienne par défaut sur "Toutes"
  useEffect(() => {
    if (!defaultTab && activeTab !== "all") {
      setActiveTab("all");
    }
  }, [defaultTab, activeTab, setActiveTab]);

  return (
    <AppLayout>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <GrowthDashboardHeader totalRequests={allRequests.length} />
        
        <GrowthDashboardContent
          allRequests={allRequests}
          filteredRequests={filteredRequests}
          activeTab={activeTab}
          activeFilter={activeFilter}
          setActiveTab={setActiveTab}
          onEditRequest={handleOpenEditDialog}
          onCompleteRequest={handleOpenCompletionDialog}
          onViewDetails={handleViewDetails}
          onRequestUpdated={handleRequestUpdated}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          onStatClick={handleStatCardClick}
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
