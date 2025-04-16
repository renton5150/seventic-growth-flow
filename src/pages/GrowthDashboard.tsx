
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthFilterTabs } from "@/components/growth/GrowthFilterTabs";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useEffect } from "react";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const {
    filteredRequests,
    activeTab,
    setActiveTab,
    selectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleRequestUpdated,
    assignRequestToMe,
    updateRequestWorkflowStatus
  } = useGrowthDashboard(defaultTab);

  // Log for debugging mission data
  useEffect(() => {
    console.log("GrowthDashboard - filteredRequests with mission data:", filteredRequests);
  }, [filteredRequests]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Growth</h1>
        </div>
        
        <GrowthFilterTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <GrowthRequestsTable
          requests={filteredRequests}
          onEditRequest={handleOpenEditDialog}
          onCompleteRequest={handleOpenCompletionDialog}
          onRequestUpdated={handleRequestUpdated}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={activeTab}
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
