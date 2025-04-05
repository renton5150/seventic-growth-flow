
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthFilterTabs } from "@/components/growth/GrowthFilterTabs";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";

const GrowthDashboard = () => {
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
    handleRequestUpdated
  } = useGrowthDashboard();

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
