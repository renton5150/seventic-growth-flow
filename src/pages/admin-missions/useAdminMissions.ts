
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

  const isActionInProgress = useRef(false);
  const operationTimeoutRef = useRef<number | null>(null);

  const { 
    data: missions = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['missions', 'admin', refreshKey],
    queryFn: async () => {
      try {
        const allMissions = await getAllMissions();
        return allMissions;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 15000,
    retry: 1,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error("Erreur lors du chargement des missions");
    }
  }, [isError, error]);

  useEffect(() => {
    return () => {
      if (operationTimeoutRef.current !== null) {
        clearTimeout(operationTimeoutRef.current);
      }
    };
  }, []);

  const refreshMissionsData = useCallback(() => {
    if (isActionInProgress.current) {
      if (operationTimeoutRef.current !== null) {
        clearTimeout(operationTimeoutRef.current);
      }
      operationTimeoutRef.current = window.setTimeout(() => {
        refreshMissionsData();
      }, 500);
      return;
    }
    isActionInProgress.current = true;
    queryClient.invalidateQueries({ queryKey: ['missions'], exact: false });
    setRefreshKey(prev => prev + 1);
    operationTimeoutRef.current = window.setTimeout(() => {
      refetch()
        .then(() => {
          operationTimeoutRef.current = window.setTimeout(() => {
            isActionInProgress.current = false;
          }, 300);
        })
        .catch(() => {
          toast.error("Erreur lors du rafraîchissement des données");
          isActionInProgress.current = false;
        });
    }, 300);
  }, [queryClient, refetch]);

  useEffect(() => {
    if (!isEditModalOpen && missionToEdit) {
      const timer = setTimeout(() => {
        setMissionToEdit(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditModalOpen, missionToEdit]);

  // Handlers
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
    setMissionToDelete(null);
    refreshMissionsData();
  };

  const handleEditMission = (mission: Mission) => {
    if (isActionInProgress.current) return;
    setMissionToEdit({ ...mission });
    setIsEditModalOpen(true);
  };

  const handleMissionUpdated = () => {
    setTimeout(() => {
      refreshMissionsData();
    }, 500);
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
