import { useCallback, useState } from "react";
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
import { getAllMissions } from "@/services/missionService";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  
  const refreshMissionsData = useCallback(() => {
    console.log("Rafraîchissement des données de missions depuis AdminMissions");
    
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['missions'],
        refetchType: 'all' 
      });
    }, 100);
  }, [queryClient]);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', 'admin'],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour l'administrateur");
        const allMissions = await getAllMissions();
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
      </div>
    </AppLayout>
  );
};

export default AdminMissions;
