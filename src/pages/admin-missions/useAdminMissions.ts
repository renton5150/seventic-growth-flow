
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

  // Flag pour suivre si une action est en cours
  const isActionInProgress = useRef(false);
  const refreshTimeoutRef = useRef<number | null>(null);

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
    staleTime: 15000,
    retry: 1,
  });

  // Afficher un toast en cas d'erreur
  useEffect(() => {
    if (isError && error) {
      toast.error("Erreur lors du chargement des missions");
      console.error("Erreur de chargement:", error);
    }
  }, [isError, error]);

  // Nettoyer les timeouts en sortant du composant
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Fonction pour rafraîchir les données des missions
  const refreshMissionsData = useCallback(() => {
    console.log("Rafraîchissement des données demandé");
    
    // Si une action est déjà en cours, planifions un refresh pour plus tard
    if (isActionInProgress.current) {
      console.log("Action déjà en cours, planification d'un refresh ultérieur");
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(refreshMissionsData, 500);
      return;
    }
    
    // Indiquons qu'une action est en cours
    isActionInProgress.current = true;
    
    // Invalidons le cache des requêtes et incrémentons la clé de rafraîchissement
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    setRefreshKey(prev => prev + 1);
    
    console.log("Démarrage de la requête de rafraîchissement");
    
    // Planifions un refetch avec un court délai
    refreshTimeoutRef.current = window.setTimeout(() => {
      refetch()
        .then(() => {
          console.log("Rafraîchissement réussi");
          // Réinitialisons le flag d'action en cours après un court délai
          refreshTimeoutRef.current = window.setTimeout(() => {
            isActionInProgress.current = false;
            console.log("Action terminée, nouvelles actions possibles");
          }, 300);
        })
        .catch((err) => {
          console.error("Erreur lors du rafraîchissement:", err);
          toast.error("Erreur lors du rafraîchissement des données");
          isActionInProgress.current = false;
        });
    }, 300);
  }, [queryClient, refetch]);

  // Nettoyer l'état missionToEdit après la fermeture du modal d'édition
  useEffect(() => {
    if (!isEditModalOpen && missionToEdit) {
      const timer = setTimeout(() => {
        setMissionToEdit(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditModalOpen, missionToEdit]);

  // Gestionnaires d'événements
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
    if (isActionInProgress.current) {
      toast.info("Une opération est déjà en cours, veuillez patienter");
      return;
    }
    setMissionToDelete(mission);
  };

  const handleDeleteSuccess = () => {
    console.log("Suppression réussie, nettoyage de l'état");
    setMissionToDelete(null);
    
    // Utilisons setTimeout pour éviter les problèmes de rendu
    setTimeout(() => {
      refreshMissionsData();
    }, 300);
  };

  const handleEditMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setMissionToEdit({ ...mission });
    setIsEditModalOpen(true);
  };

  const handleMissionUpdated = () => {
    setTimeout(() => {
      refreshMissionsData();
    }, 300);
  };

  const handleEditDialogChange = (open: boolean) => {
    if (!open && isActionInProgress.current) return;
    setIsEditModalOpen(open);
  };

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
    isActionInProgress,
    refetch,
  };
}
