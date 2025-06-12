
import { useQuery } from "@tanstack/react-query";
import { fetchSimpleRequests } from "@/services/requests/simpleRequestService";

/**
 * Hook ultra-simple pour récupérer les demandes
 * Remplace toute la complexité précédente
 */
export const useSimpleRequests = () => {
  return useQuery({
    queryKey: ['simple-requests'],
    queryFn: fetchSimpleRequests,
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
    retry: 2,
    retryDelay: 1000,
  });
};
