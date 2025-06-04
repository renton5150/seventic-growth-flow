
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useMyAssignmentRequests = (
  userId: string | undefined, 
  isGrowth: boolean, 
  isSDR: boolean, 
  isAdmin: boolean
) => {
  return useQuery({
    queryKey: ['requests-my-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (isGrowth && !isAdmin) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          assignedTo: userId
        });
      } else if (isSDR) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          createdBy: userId
        });
      } else if (isAdmin) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          assignedToIsNotNull: true
        });
      }
      
      return [];
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
};
