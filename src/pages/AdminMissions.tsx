
import { useCallback, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { Mission } from "@/types/types";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { getAllMissions } from "@/services/missions-service";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // Fonction optimisée de rafraîchissement des données
  const refreshMissionsData = useCallback(() => {
    console.log("Rafraîchissement des données de missions depuis AdminMissions");
    
    // Invalider le cache de requête
    queryClient.invalidateQueries({ 
      queryKey: ['missions', 'admin'],
    });
    
    // Déclencher un nouveau rendu en forçant une nouvelle requête
    setRefreshKey(prev => prev + 1);
  }, [queryClient]);

  // Requête optimisée avec clé de dépendance pour forcer le rafraîchissement
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour l'administrateur");
        const allMissions = await getAllMissions();
        console.log("Missions récupérées:", allMissions.length);
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
    setIsCreateModalOpen(true);
  };

  const handleViewMission = (mission: Mission) => {
    setSelectedMission(mission);
  };
  
  const handleDeleteMission = (mission: Mission) => {
    setMissionToDelete(mission);
  };
  
  const handleDeleteSuccess = () => {
    refreshMissionsData();
  };

  const handleEditMission = (mission: Mission) => {
    setMissionToEdit(mission);
    setIsEditModalOpen(true);
  };
  
  // Fonction de rafraîchissement avec délai pour garantir la mise à jour complète
  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, rafraîchissement des données");
    // Ajout d'un délai pour garantir que la base de données a bien été mise à jour
    setTimeout(() => {
      refreshMissionsData();
    }, 300);
  };
  
  // Gestion optimisée de la fermeture de la boîte de dialogue d'édition
  const handleEditDialogChange = (open: boolean) => {
    setIsEditModalOpen(open);
    
    if (!open) {
      // Réinitialiser missionToEdit avec un délai pour éviter les problèmes de rendu
      setTimeout(() => {
        setMissionToEdit(null);
      }, 200);
    }
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
          onOpenChange={handleEditDialogChange}
          onMissionUpdated={handleMissionUpdated}
        />
      </div>
    </AppLayout>
  );
};

export default AdminMissions;
