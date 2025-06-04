
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";

export const useToAssignRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['requests-to-assign', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await fetchRequests({
        assignedToIsNull: true,
        workflowStatus: 'pending_assignment'
      });
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
};
