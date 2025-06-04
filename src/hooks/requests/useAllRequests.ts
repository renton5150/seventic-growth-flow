
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useAllRequests = (
  userId: string | undefined, 
  isSDR: boolean
) => {
  return useQuery({
    queryKey: ['requests-all', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (isSDR) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          createdBy: userId
        });
      } else {
        return await fetchRequests({
          workflowStatusNot: 'completed'
        });
      }
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
};
