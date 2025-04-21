
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { useAdminMissions } from "./admin-missions/useAdminMissions";
import { AdminMissionsHeader } from "./admin-missions/AdminMissionsHeader";
import { AdminMissionsLoading } from "./admin-missions/AdminMissionsLoading";
import { AdminMissionsError } from "./admin-missions/AdminMissionsError";
import { useEffect } from "react";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const {
    missions,
    isLoading,
    isError,
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

  // Chargement initial unique
  useEffect(() => {
    // Faire une seule requête au chargement du composant
    refetch();
  }, [refetch]);

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading) {
    return <AdminMissionsLoading />;
  }

  if (isError) {
    return <AdminMissionsError onRetry={refetch} />;
  }

  return (
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
  );
};

export default AdminMissions;
