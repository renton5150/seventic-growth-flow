
import { useCallback, useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAllMissions } from "@/services/missions-service";
import { Mission } from "@/types/types";

export function useAdminMissions() {
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Référence pour empêcher les opérations simultanées
  const isRefreshing = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);
  
  // Requête pour obtenir les missions
  const { 
    data: missions = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: getAllMissions,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
    meta: {
      onError: (err: Error) => {
        console.error("Erreur de requête:", err);
        toast.error("Erreur lors du chargement des missions");
      }
    }
  });

  // Fonction pour rafraîchir les données avec protection contre les appels multiples
  const refreshMissionsData = useCallback(() => {
    // Si un rafraîchissement est déjà planifié, annuler
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Si un rafraîchissement est en cours, ne rien faire
    if (isRefreshing.current) {
      return;
    }
    
    console.log("Demande de rafraîchissement des missions");
    isRefreshing.current = true;
    
    // Planifier le rafraîchissement
    refreshTimerRef.current = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      setRefreshKey(prev => prev + 1);
      
      // Utiliser setTimeout pour refetch après l'invalidation
      window.setTimeout(() => {
        refetch()
          .finally(() => {
            console.log("Rafraîchissement terminé");
            isRefreshing.current = false;
          });
      }, 100);
      
      refreshTimerRef.current = null;
    }, 300);
  }, [queryClient, refetch]);

  // Gestionnaire pour la suppression d'une mission
  const handleDeleteSuccess = useCallback(() => {
    setMissionToDelete(null);
    refreshMissionsData();
  }, [refreshMissionsData]);

  // Gestionnaires d'événements
  const handleCreateMissionClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleViewMission = useCallback((mission: Mission) => {
    setSelectedMission(mission);
  }, []);

  const handleDeleteMission = useCallback((mission: Mission) => {
    setMissionToDelete(mission);
  }, []);

  const handleEditMission = useCallback((mission: Mission) => {
    setMissionToEdit({ ...mission });
    setIsEditModalOpen(true);
  }, []);

  const handleMissionUpdated = useCallback(() => {
    refreshMissionsData();
  }, [refreshMissionsData]);

  const handleEditDialogChange = useCallback((open: boolean) => {
    setIsEditModalOpen(open);
    
    if (!open) {
      // Si le dialogue se ferme, nettoyer l'état
      setTimeout(() => {
        setMissionToEdit(null);
      }, 100);
    }
  }, []);

  return {
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
    setMissionToEdit,
    isEditModalOpen,
    setIsEditModalOpen,
    refreshMissionsData,
    handleCreateMissionClick,
    handleViewMission,
    handleDeleteMission,
    handleDeleteSuccess,
    handleEditMission,
    handleMissionUpdated,
    handleEditDialogChange,
    isRefreshing: isRefreshing.current,
    refetch,
  };
}
