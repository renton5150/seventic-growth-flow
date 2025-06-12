
import { useQuery } from "@tanstack/react-query";
import { fetchDirectRequests } from "@/services/requests/directRequestService";

/**
 * Hook de récupération DIRECTE des demandes
 * Contourne le système de formatage complexe
 */
export const useDirectRequests = () => {
  console.log("🚀 [DIRECT] Initialisation useDirectRequests");
  
  return useQuery({
    queryKey: ['direct-requests'],
    queryFn: async () => {
      console.log("🔍 [DIRECT] Exécution de queryFn dans useDirectRequests");
      try {
        const result = await fetchDirectRequests();
        console.log("✅ [DIRECT] useDirectRequests queryFn SUCCESS:", result.length, "demandes");
        console.log("🔍 [DIRECT] Première demande récupérée:", result[0]);
        return result;
      } catch (error) {
        console.error("❌ [DIRECT] useDirectRequests queryFn ERROR:", error);
        throw error;
      }
    },
    refetchInterval: 10000,
    retry: 2,
    retryDelay: 1000
  });
};
