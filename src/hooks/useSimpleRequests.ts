
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
      const result = await fetchSimpleRequests();
      console.log("🔍 [DIAGNOSTIC] Résultat du queryFn:", result.length, "demandes");
      return result;
    },
    refetchInterval: 10000,
    retry: 2,
    retryDelay: 1000,
    onSuccess: (data) => {
      console.log("✅ [DIAGNOSTIC] useSimpleRequests onSuccess:", data.length, "demandes");
    },
    onError: (error) => {
      console.error("❌ [DIAGNOSTIC] useSimpleRequests onError:", error);
    }
  });
};
