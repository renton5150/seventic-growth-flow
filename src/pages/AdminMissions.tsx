
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
  
  // Use refs to track operation state and prevent overlapping actions
  const isActionInProgress = useRef(false);
  const operationTimeoutRef = useRef<number | null>(null);
  const deletionInProgress = useRef(false);
  
  // Advanced query configuration
  const { 
    data: missions = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: async () => {
      console.log("Chargement des missions pour l'administrateur");
      try {
        const allMissions = await getAllMissions();
        console.log(`Missions récupérées: ${allMissions.length}`);
        return allMissions;
      } catch (error) {
        console.error("Erreur lors du chargement des missions:", error);
        throw error;
      }
    },
    staleTime: 15000,
    retry: 1,
    meta: {
      // Error handling moved to meta object
      onError: (err: Error) => {
        console.error("Erreur dans la requête de missions:", err);
      }
    }
  });

  // Separate effect for handling query errors
  useEffect(() => {
    if (error) {
      console.error("Erreur de requête détectée:", error);
      toast.error("Erreur lors du chargement des missions");
    }
  }, [error]);
  
  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (operationTimeoutRef.current !== null) {
        clearTimeout(operationTimeoutRef.current);
      }
    };
  }, []);
  
  // Safe refresh function with improved state management
  const refreshMissionsData = useCallback(() => {
    if (isActionInProgress.current) {
      console.log("Une action est déjà en cours, rafraîchissement programmé");
      
      // Clear any existing timeout and schedule a new one
      if (operationTimeoutRef.current !== null) {
        clearTimeout(operationTimeoutRef.current);
      }
      
      operationTimeoutRef.current = window.setTimeout(() => {
        console.log("Exécution du rafraîchissement différé");
        refreshMissionsData();
      }, 500);
      
      return;
    }
    
    console.log("Rafraîchissement des missions");
    isActionInProgress.current = true;
    
    // Invalidate all queries related to missions
    queryClient.invalidateQueries({ 
      queryKey: ['missions'],
      exact: false
    });
    
    // Increment refresh key to force re-render
    setRefreshKey(prev => prev + 1);
    
    // Schedule a refetch with a delay
    operationTimeoutRef.current = window.setTimeout(() => {
      refetch()
        .then(() => {
          console.log("Missions refetchées avec succès");
          // Reset action flag with a delay
          operationTimeoutRef.current = window.setTimeout(() => {
            isActionInProgress.current = false;
            console.log("Action terminée, rafraîchissement disponible");
          }, 300);
        })
        .catch(err => {
          console.error("Erreur pendant le refetch:", err);
          toast.error("Erreur lors du rafraîchissement des données");
          isActionInProgress.current = false;
        });
    }, 300);
  }, [queryClient, refetch]);

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

  // Improved handler functions with better state management
  const handleCreateMissionClick = () => {
    if (isActionInProgress.current) {
      toast.info("Une opération est déjà en cours, veuillez patienter");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleViewMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setSelectedMission(mission);
  };
  
  const handleDeleteMission = (mission: Mission) => {
    if (isActionInProgress.current || deletionInProgress.current) {
      toast.info("Une opération est déjà en cours, veuillez patienter");
      return;
    }
    console.log("Préparation à la suppression de la mission:", mission.id);
    deletionInProgress.current = true;
    setMissionToDelete(mission);
  };
  
  const handleDeleteSuccess = () => {
    console.log("Mission supprimée avec succès, rafraîchissement programmé");
    
    // Mark deletion as complete
    setMissionToDelete(null);
    
    // Schedule a complete data refresh
    operationTimeoutRef.current = window.setTimeout(() => {
      refreshMissionsData();
      // Reset deletion flag after data is refreshed
      operationTimeoutRef.current = window.setTimeout(() => {
        deletionInProgress.current = false;
        console.log("Processus de suppression terminé");
      }, 500);
    }, 300);
  };

  const handleEditMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setMissionToEdit({...mission});
    setIsEditModalOpen(true);
  };
  
  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, rafraîchissement programmé");
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  };
  
  const handleEditDialogChange = (open: boolean) => {
    if (!open && isActionInProgress.current) return;
    setIsEditModalOpen(open);
  };

  // Render logic
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
          <Button onClick={() => refetch()}>Réessayer</Button>
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
