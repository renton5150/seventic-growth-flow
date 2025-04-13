
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { MissionsListView } from "@/components/missions/MissionsListView";
import { useQueryClient } from "@tanstack/react-query";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Fonction pour rafraîchir les données de missions
  const refreshMissionsData = () => {
    console.log("Rafraîchissement des données de missions depuis AdminMissions");
    
    // Invalider le cache des requêtes et forcer un rechargement
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['missions'],
        refetchType: 'all' 
      });
    }, 100);
  };

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleCreateMissionClick = () => {
    console.log("Ouverture de la modal de création de mission");
    setIsCreateModalOpen(true);
  };

  const handleViewMission = (mission: Mission) => {
    console.log("Navigation vers la page de détail de la mission:", mission.id);
    navigate(`/admin/missions/${mission.id}`);
  };
  
  const handleDeleteMission = (mission: Mission) => {
    console.log("Demande de suppression de la mission:", mission);
    setMissionToDelete(mission);
  };
  
  const handleDeleteSuccess = () => {
    console.log("Mission supprimée avec succès, rafraîchissement des données");
    refreshMissionsData();
  };

  const handleEditMission = (mission: Mission) => {
    console.log("Demande d'édition de la mission:", mission);
    setMissionToEdit(mission);
    setIsEditModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion des missions</h1>
          <Button onClick={handleCreateMissionClick} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
          </Button>
        </div>
        
        <MissionsListView
          isAdmin={true}
          onCreateMission={handleCreateMissionClick}
          onViewMission={handleViewMission}
          onEditMission={handleEditMission}
          onDeleteMission={handleDeleteMission}
          onMissionUpdated={refreshMissionsData}
        />
        
        <CreateMissionDialog 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={refreshMissionsData} 
        />
        
        {missionToDelete && (
          <DeleteMissionDialog
            missionId={missionToDelete.id}
            missionName={missionToDelete.name}
            isOpen={!!missionToDelete}
            onOpenChange={(open) => !open && setMissionToDelete(null)}
            onDeleted={handleDeleteSuccess}
          />
        )}
        
        <EditMissionDialog
          mission={missionToEdit}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onMissionUpdated={refreshMissionsData}
        />
      </div>
    </AppLayout>
  );
};

export default AdminMissions;
