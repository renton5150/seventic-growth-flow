
import { useCallback, useState, useRef } from "react";
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

  // Référence pour suivre si une opération de rafraîchissement est déjà en cours
  const isRefreshing = useRef(false);
  const pendingRefresh = useRef(false);
  
  // Requête pour obtenir les missions avec staleTime plus élevé pour réduire les rendus inutiles
  const { 
    data: missions = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: getAllMissions,
    staleTime: 30000, // Augmenter le temps de fraîcheur pour réduire les requêtes fréquentes
    retry: 1,
    meta: {
      onError: (err: Error) => {
        console.error("Erreur de requête:", err);
        toast.error("Erreur lors du chargement des missions");
      }
    }
  });

  // Fonction pour rafraîchir les données des missions de manière sécurisée avec debounce
  const refreshMissionsData = useCallback(() => {
    // Si un rafraîchissement est déjà en cours, on ignore cette demande
    if (isRefreshing.current) {
      pendingRefresh.current = true;
      return;
    }
    
    // Indiquer qu'un rafraîchissement est en cours
    isRefreshing.current = true;
    
    // Invalidons le cache uniquement si nécessaire
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    setRefreshKey(prev => prev + 1);
    
    // Utiliser un court délai pour permettre aux opérations asynchrones de se terminer
    setTimeout(() => {
      refetch()
        .then(() => {
          // Vérifier si un autre rafraîchissement est en attente
          if (pendingRefresh.current) {
            pendingRefresh.current = false;
            setTimeout(() => {
              isRefreshing.current = false;
              refreshMissionsData(); // Uniquement si réellement nécessaire
            }, 500);
          } else {
            isRefreshing.current = false;
          }
        })
        .catch(() => {
          isRefreshing.current = false;
          pendingRefresh.current = false;
        });
    }, 300);
  }, [queryClient, refetch]);

  // Gestionnaire pour la suppression d'une mission - simplifié
  const handleDeleteSuccess = useCallback(() => {
    setMissionToDelete(null);
    
    // Utiliser setTimeout pour différer le rafraîchissement après les transitions d'UI
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  }, [refreshMissionsData]);

  // Gestionnaires d'événements
  const handleCreateMissionClick = useCallback(() => {
    if (isRefreshing.current) {
      return; // Éviter les actions pendant un rafraîchissement
    }
    setIsCreateModalOpen(true);
  }, []);

  const handleViewMission = useCallback((mission: Mission) => {
    setSelectedMission(mission);
  }, []);

  const handleDeleteMission = useCallback((mission: Mission) => {
    if (isRefreshing.current) {
      return; // Éviter les actions pendant un rafraîchissement
    }
    setMissionToDelete(mission);
  }, []);

  const handleEditMission = useCallback((mission: Mission) => {
    if (isRefreshing.current) {
      return; // Éviter les actions pendant un rafraîchissement
    }
    setMissionToEdit({ ...mission });
    setIsEditModalOpen(true);
  }, []);

  const handleMissionUpdated = useCallback(() => {
    // Attendre que l'UI ait fini ses transitions avant de rafraîchir
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
  }, [refreshMissionsData]);

  const handleEditDialogChange = useCallback((open: boolean) => {
    if (!open && isRefreshing.current) return;
    setIsEditModalOpen(open);
    
    // Si le dialogue se ferme, nettoyer l'état après un délai
    if (!open) {
      setTimeout(() => {
        setMissionToEdit(null);
      }, 300);
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
