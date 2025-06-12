
import { useQuery } from "@tanstack/react-query";
import { fetchSimpleRequests } from "@/services/requests/simpleRequestService";

/**
 * Hook ultra-simple pour récupérer les demandes
 * AVEC logs détaillés pour diagnostiquer
 */
export const useSimpleRequests = () => {
  console.log("🔍 [DIAGNOSTIC] Initialisation useSimpleRequests");
  
  return useQuery({
    queryKey: ['simple-requests'],
    queryFn: async () => {
      console.log("🔍 [DIAGNOSTIC] Exécution de queryFn dans useSimpleRequests");
      try {
        const result = await fetchSimpleRequests();
        console.log("✅ [DIAGNOSTIC] useSimpleRequests queryFn SUCCESS:", result.length, "demandes");
        console.log("🔍 [DIAGNOSTIC] Première demande récupérée:", result[0]);
        return result;
      } catch (error) {
        console.error("❌ [DIAGNOSTIC] useSimpleRequests queryFn ERROR:", error);
        throw error;
      }
    },
    refetchInterval: 10000,
    retry: 2,
    retryDelay: 1000
  });
};
