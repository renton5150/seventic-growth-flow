
import { useCallback, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { Mission } from "@/types/types";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { getAllMissions } from "@/services/missions-service"; // Updated import path
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const refreshMissionsData = useCallback(() => {
    console.log("Rafraîchissement des données de missions depuis AdminMissions");
    
    // Invalider le cache de requête et forcer une récupération
    queryClient.invalidateQueries({ 
      queryKey: ['missions'],
      refetchType: 'all' 
    });
  }, [queryClient]);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', 'admin'],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour l'administrateur");
        const allMissions = await getAllMissions();
        console.log("Missions récupérées:", allMissions);
        return allMissions;
      } catch (error) {
        console.error("Erreur lors du chargement des missions:", error);
        toast.error("Erreur lors du chargement des missions");
        return [];
      }
    }
  });

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleCreateMissionClick = () => {
    console.log("Ouverture de la modal de création de mission");
    setIsCreateModalOpen(true);
  };

  const handleViewMission = (mission: Mission) => {
    console.log("Affichage de la mission:", mission);
    setSelectedMission(mission);
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
  
  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, rafraîchissement des données");
    // Attendre un court moment avant de rafraîchir pour permettre à la base de données de se mettre à jour
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement des missions...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion des missions</h1>
          <Button onClick={handleCreateMissionClick} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
          </Button>
        </div>
        
        {missions.length === 0 ? (
          <EmptyMissionState 
            isSdr={false} 
            onCreateMission={handleCreateMissionClick} 
          />
        ) : (
          <MissionsTable 
            missions={missions} 
            isAdmin={true} 
            onViewMission={handleViewMission}
            onDeleteMission={handleDeleteMission}
            onEditMission={handleEditMission}
            onMissionUpdated={refreshMissionsData}
          />
        )}
        
        <CreateMissionDialog 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={refreshMissionsData} 
        />
        
        <MissionDetailsDialog 
          mission={selectedMission} 
          open={!!selectedMission} 
          onOpenChange={(open) => !open && setSelectedMission(null)} 
          isSdr={false} 
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
          onMissionUpdated={handleMissionUpdated}
        />
      </div>
    </AppLayout>
  );
};

export default AdminMissions;
