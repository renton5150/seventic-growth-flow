
import { useQuery } from "@tanstack/react-query";
import { fetchAllGrowthRequests } from "@/services/requests/singleRequestService";

/**
 * Hook unique pour toutes les demandes Growth
 * Remplace tous les hooks spécialisés pour éliminer les incohérences
 */
export const useSingleRequestSource = () => {
  return useQuery({
    queryKey: ['growth-all-requests-unified'],
    queryFn: fetchAllGrowthRequests,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
