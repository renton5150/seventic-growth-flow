
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { MissionErrorBoundary } from "@/components/missions/ErrorBoundary";
import { MissionLoadingState } from "@/components/missions/MissionLoadingState";
import { MissionErrorState } from "@/components/missions/MissionErrorState";
import { useAdminMissions } from "./admin-missions/useAdminMissions";
import { AdminMissionsHeader } from "./admin-missions/AdminMissionsHeader";
import { useEffect } from "react";
import { toast } from "sonner";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const {
    missions,
    isLoading,
    isError,
    error,
    selectedMission,
    setSelectedMission,
    isCreateModalOpen,
    setIsCreateModalOpen,
    missionToDelete,
    setMissionToDelete,
    missionToEdit,
    isEditModalOpen,
    handleCreateMissionClick,
    handleViewMission,
    handleDeleteMission,
    handleDeleteSuccess,
    handleEditMission,
    handleMissionUpdated,
    handleEditDialogChange,
    refetch,
  } = useAdminMissions();

  // Chargement initial une seule fois au montage du composant
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("Chargement initial des missions admin...");
        await refetch();
        console.log("Chargement initial terminé");
      } catch (error) {
        console.error("Erreur de chargement initial:", error);
        toast.error("Erreur de chargement", {
          description: "Impossible de charger les missions."
        });
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading) {
    return (
      <AppLayout>
        <MissionLoadingState />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <MissionErrorState 
          onRetry={refetch}
          error={error instanceof Error ? error.message : "Erreur lors du chargement des missions"}
        />
      </AppLayout>
    );
  }

  return (
    <MissionErrorBoundary>
      <AppLayout>
        <div className="space-y-6">
          <AdminMissionsHeader onCreateMission={handleCreateMissionClick} />

          {missions.length === 0 ? (
            <EmptyMissionState isSdr={false} onCreateMission={handleCreateMissionClick} />
          ) : (
            <MissionsTable
              missions={missions}
              isAdmin={true}
              onViewMission={handleViewMission}
              onDeleteMission={handleDeleteMission}
              onEditMission={handleEditMission}
              onMissionUpdated={handleMissionUpdated}
            />
          )}

          {isCreateModalOpen && (
            <CreateMissionDialog 
              open={isCreateModalOpen} 
              onOpenChange={setIsCreateModalOpen} 
              onSuccess={handleMissionUpdated} 
            />
          )}

          {selectedMission && (
            <MissionDetailsDialog
              mission={selectedMission}
              open={!!selectedMission}
              onOpenChange={(open) => !open && setSelectedMission(null)}
              isSdr={false}
            />
          )}

          {missionToDelete && (
            <DeleteMissionDialog
              missionId={missionToDelete.id}
              missionName={missionToDelete.name}
              isOpen={!!missionToDelete}
              onOpenChange={(open) => {
                if (!open) {
                  setMissionToDelete(null);
                }
              }}
              onDeleted={handleDeleteSuccess}
            />
          )}

          {missionToEdit && (
            <EditMissionDialog
              mission={missionToEdit}
              open={isEditModalOpen}
              onOpenChange={handleEditDialogChange}
              onMissionUpdated={handleMissionUpdated}
            />
          )}
        </div>
      </AppLayout>
    </MissionErrorBoundary>
  );
};

export default AdminMissions;
