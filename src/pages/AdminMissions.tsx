
import { useCallback, useState, useRef, useEffect } from "react";
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
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { getAllMissions } from "@/services/missions-service";

const AdminMissions = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const isActionInProgress = useRef(false);
  
  // Advanced query configuration with retry and better error handling
  const { 
    data: missions = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour l'administrateur");
        const allMissions = await getAllMissions();
        console.log("Missions récupérées:", allMissions.length);
        return allMissions;
      } catch (error) {
        console.error("Erreur lors du chargement des missions:", error);
        throw error;  // Let the query error handling take care of it
      }
    },
    staleTime: 15000,
    retry: 1,
    onError: (err) => {
      console.error("Erreur dans la requête de missions:", err);
      toast.error("Impossible de charger les missions");
    }
  });
  
  // Safe refresh function that uses a ref to prevent overlapping operations
  const refreshMissionsData = useCallback(() => {
    if (isActionInProgress.current) {
      console.log("Une action est déjà en cours, rafraîchissement ignoré");
      return;
    }
    
    console.log("Rafraîchissement des missions");
    isActionInProgress.current = true;
    
    // Invalidate query cache
    queryClient.invalidateQueries({ 
      queryKey: ['missions', 'admin'],
    });
    
    // Force a new render by updating refresh key
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      isActionInProgress.current = false;
    }, 300);
  }, [queryClient]);

  // Cleanup effect for modals and state
  useEffect(() => {
    if (!isEditModalOpen && missionToEdit) {
      const timer = setTimeout(() => {
        setMissionToEdit(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditModalOpen, missionToEdit]);

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Handler functions
  const handleCreateMissionClick = () => {
    if (isActionInProgress.current) return;
    setIsCreateModalOpen(true);
  };

  const handleViewMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setSelectedMission(mission);
  };
  
  const handleDeleteMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setMissionToDelete(mission);
  };
  
  const handleDeleteSuccess = () => {
    console.log("Mission supprimée avec succès");
    
    // Mark deletion as complete and clean up references
    setMissionToDelete(null);
    
    // Schedule data refresh with delay
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  };

  const handleEditMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setMissionToEdit({...mission});
    setIsEditModalOpen(true);
  };
  
  const handleMissionUpdated = () => {
    console.log("Mission mise à jour");
    
    // Schedule refresh with delay
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  };
  
  const handleEditDialogChange = (open: boolean) => {
    if (!open && isActionInProgress.current) return;
    setIsEditModalOpen(open);
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
  
  if (isError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-red-500">Erreur lors du chargement des missions</p>
          <Button onClick={refreshMissionsData}>Réessayer</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion des missions</h1>
          <Button 
            onClick={handleCreateMissionClick} 
            className="bg-blue-600 hover:bg-blue-700"
          >
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
            onOpenChange={(open) => {
              if (!open) {
                setMissionToDelete(null);
              }
            }}
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
