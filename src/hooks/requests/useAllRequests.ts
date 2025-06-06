
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useAllRequests = (
  userId: string | undefined, 
  isSDR: boolean
) => {
  return useQuery({
    queryKey: ['requests-all', userId, isSDR],
    queryFn: async () => {
      if (!userId) {
        console.log("[useAllRequests] Pas d'userId fourni");
        return [];
      }
      
      try {
        console.log(`[useAllRequests] Récupération de toutes les demandes, isSDR: ${isSDR}`);
        
        if (isSDR) {
          const requests = await fetchRequests({
            workflowStatusNot: 'completed',
            createdBy: userId
          });
          console.log(`[useAllRequests] ${requests.length} demandes SDR récupérées`);
          return requests;
        } else {
          const requests = await fetchRequests({
            workflowStatusNot: 'completed'
          });
          console.log(`[useAllRequests] ${requests.length} demandes récupérées`);
          return requests;
        }
      } catch (error) {
        console.error("[useAllRequests] Erreur:", error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 5000, // Réduire l'intervalle pour une meilleure réactivité
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
