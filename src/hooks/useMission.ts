
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mission } from "@/types/types";
import { getMissionById } from "@/services/missions-service/missionService";

/**
 * Hook personnalisé pour récupérer et gérer les détails d'une mission spécifique
 * @param missionId L'ID de la mission à récupérer
 * @returns Un objet contenant la mission, ainsi que les états de chargement et d'erreur
 */
export const useMission = (missionId: string | undefined) => {
  const queryClient = useQueryClient();

  const {
    data: mission,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => {
      if (!missionId) return null;
      console.log("Récupération des détails de la mission:", missionId);
      return getMissionById(missionId);
    },
    enabled: !!missionId,
  });

  // Fonction pour invalider le cache et forcer un rechargement
  const refreshMission = () => {
    console.log("Rafraîchissement des données de la mission", missionId);
    if (missionId) {
      queryClient.invalidateQueries({
        queryKey: ["mission", missionId],
        refetchType: "all",
      });
    }
  };

  return {
    mission,
    isLoading,
    isError,
    error,
    refetch,
    refreshMission,
  };
};
