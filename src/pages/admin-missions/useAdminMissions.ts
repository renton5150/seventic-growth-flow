
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
  
  // Référence pour éviter les opérations simultanées
  const isRefreshing = useRef(false);
  
  // Requête pour obtenir les missions avec un temps de cache plus long
  const { 
    data: missions = [], 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['missions', 'admin'],
    queryFn: getAllMissions,
    staleTime: 5 * 60 * 1000, // 5 minutes pour éviter les rechargements fréquents
    refetchOnWindowFocus: false,
    retry: 0, // Pas de tentatives répétées
    refetchInterval: false, // Pas de rechargement automatique périodique
    meta: {
      onSettled: (_, error) => {
        if (error) {
          console.error("Erreur de requête:", error);
          toast.error("Erreur lors du chargement des missions");
        }
      }
    }
  });

  // Fonction pour rafraîchir les données avec protection contre les appels multiples
  const refreshMissionsData = useCallback(async () => {
    // Si un rafraîchissement est déjà en cours, ne rien faire
    if (isRefreshing.current) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return;
    }
    
    console.log("Demande de rafraîchissement des missions");
    isRefreshing.current = true;
    
    try {
      // Invalider la requête et forcer un nouveau chargement
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      
      // Attendre un peu avant de lancer le refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetch();
      console.log("Rafraîchissement terminé");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      // Attendre un moment avant de permettre un nouveau rafraîchissement
      setTimeout(() => {
        isRefreshing.current = false;
      }, 1000);
    }
  }, [queryClient, refetch]);

  // Gestionnaire pour la suppression d'une mission
  const handleDeleteSuccess = useCallback(() => {
    setMissionToDelete(null);
    
    // Attendre un court délai avant de rafraîchir les données
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
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
    // Attendre un court délai avant de rafraîchir les données
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
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
