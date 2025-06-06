
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useMyAssignmentRequests = (
  userId: string | undefined, 
  isGrowth: boolean, 
  isSDR: boolean, 
  isAdmin: boolean
) => {
  return useQuery({
    queryKey: ['requests-my-assignments', userId, isGrowth, isSDR, isAdmin],
    queryFn: async () => {
      if (!userId) {
        console.log("[useMyAssignmentRequests] Pas d'userId fourni");
        return [];
      }
      
      try {
        console.log(`[useMyAssignmentRequests] Récupération des assignations, isGrowth: ${isGrowth}, isSDR: ${isSDR}, isAdmin: ${isAdmin}`);
        
        if (isGrowth && !isAdmin) {
          const requests = await fetchRequests({
            workflowStatusNot: 'completed',
            assignedTo: userId
          });
          console.log(`[useMyAssignmentRequests] ${requests.length} demandes Growth récupérées`);
          return requests;
        } else if (isSDR) {
          const requests = await fetchRequests({
            workflowStatusNot: 'completed',
            createdBy: userId
          });
          console.log(`[useMyAssignmentRequests] ${requests.length} demandes SDR récupérées`);
          return requests;
        } else if (isAdmin) {
          const requests = await fetchRequests({
            workflowStatusNot: 'completed',
            assignedToIsNotNull: true
          });
          console.log(`[useMyAssignmentRequests] ${requests.length} demandes Admin récupérées`);
          return requests;
        }
        
        return [];
      } catch (error) {
        console.error("[useMyAssignmentRequests] Erreur:", error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 5000, // Réduire l'intervalle pour une meilleure réactivité
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
