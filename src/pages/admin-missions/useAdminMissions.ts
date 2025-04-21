
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

  // Référence pour suivre si une opération de rafraîchissement est déjà en cours
  const isRefreshing = useRef(false);
  const pendingRefresh = useRef(false);

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
    staleTime: 5000, // Réduire le temps de fraîcheur pour des mises à jour plus fréquentes
    retry: 2,
    meta: {
      onError: (err: Error) => {
        console.error("Erreur de requête:", err);
        toast.error("Erreur lors du chargement des missions");
      }
    }
  });

  // Afficher un toast en cas d'erreur
  useEffect(() => {
    if (isError && error) {
      console.error("Erreur de chargement:", error);
    }
  }, [isError, error]);

  // Fonction pour rafraîchir les données des missions de manière sécurisée
  const refreshMissionsData = useCallback(() => {
    console.log("Rafraîchissement des données demandé");
    
    // Vérifier si un rafraîchissement est déjà en cours
    if (isRefreshing.current) {
      console.log("Rafraîchissement déjà en cours, marquer comme en attente");
      pendingRefresh.current = true;
      return;
    }
    
    // Indiquer qu'un rafraîchissement est en cours
    isRefreshing.current = true;
    
    // Invalidons le cache et incrémentons la clé
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    setRefreshKey(prev => prev + 1);
    
    console.log("Démarrage du rafraîchissement, clé:", refreshKey + 1);
    
    // Utiliser setTimeout pour permettre à l'interface de se mettre à jour
    setTimeout(() => {
      refetch()
        .then(() => {
          console.log("Rafraîchissement réussi");
          
          // Vérifier si un autre rafraîchissement est en attente
          if (pendingRefresh.current) {
            console.log("Traitement du rafraîchissement en attente");
            pendingRefresh.current = false;
            setTimeout(() => {
              isRefreshing.current = false;
              refreshMissionsData();
            }, 200);
          } else {
            isRefreshing.current = false;
          }
        })
        .catch((err) => {
          console.error("Erreur lors du rafraîchissement:", err);
          isRefreshing.current = false;
          pendingRefresh.current = false;
        });
    }, 200);
  }, [queryClient, refetch, refreshKey]);

  // Gestionnaire pour la suppression d'une mission
  const handleDeleteSuccess = useCallback(() => {
    console.log("Suppression réussie, nettoyage de l'état");
    setMissionToDelete(null);
    
    // Attendre un court instant avant de rafraîchir pour éviter les problèmes d'UI
    setTimeout(() => {
      refreshMissionsData();
    }, 300);
  }, [refreshMissionsData]);

  // Gestionnaires d'événements
  const handleCreateMissionClick = useCallback(() => {
    if (isRefreshing.current) {
      toast.info("Veuillez patienter, une opération est en cours");
      return;
    }
    setIsCreateModalOpen(true);
  }, []);

  const handleViewMission = useCallback((mission: Mission) => {
    setSelectedMission(mission);
  }, []);

  const handleDeleteMission = useCallback((mission: Mission) => {
    if (isRefreshing.current) {
      toast.info("Veuillez patienter, une opération est en cours");
      return;
    }
    setMissionToDelete(mission);
  }, []);

  const handleEditMission = useCallback((mission: Mission) => {
    if (isRefreshing.current) {
      toast.info("Veuillez patienter, une opération est en cours");
      return;
    }
    setMissionToEdit({ ...mission });
    setIsEditModalOpen(true);
  }, []);

  const handleMissionUpdated = useCallback(() => {
    setTimeout(() => {
      refreshMissionsData();
    }, 300);
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
