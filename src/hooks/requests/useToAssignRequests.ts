
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useToAssignRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['requests-to-assign', userId],
    queryFn: async () => {
      if (!userId) {
        console.log("[useToAssignRequests] Pas d'userId fourni");
        return [];
      }
      
      try {
        console.log("[useToAssignRequests] Récupération des demandes à assigner");
        const requests = await fetchRequests({
          assignedToIsNull: true,
          workflowStatus: 'pending_assignment'
        });
        console.log(`[useToAssignRequests] ${requests.length} demandes à assigner récupérées`);
        return requests;
      } catch (error) {
        console.error("[useToAssignRequests] Erreur:", error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 5000, // Réduire l'intervalle pour une meilleure réactivité
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
