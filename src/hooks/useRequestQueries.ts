
import { useAuth } from "@/contexts/AuthContext";
import { useToAssignRequests } from "@/hooks/requests/useToAssignRequests";
import { useMyAssignmentRequests } from "@/hooks/requests/useMyAssignmentRequests";
import { useAllRequests } from "@/hooks/requests/useAllRequests";
import { getRequestDetails } from "@/services/requests/requestQueryService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  console.log(`[useRequestQueries] USER ROLE: ${user?.role}, userId: ${userId}`);

  // Utilisation des hooks spécialisés
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useToAssignRequests(userId);
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useMyAssignmentRequests(userId, isGrowth, isSDR, isAdmin);
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useAllRequests(userId, isSDR);

  // Wrapper pour getRequestDetails avec les paramètres du contexte
  const getRequestDetailsWithContext = async (requestId: string) => {
    return await getRequestDetails(requestId, userId, isSDR);
  };

  return {
    toAssignRequests,
    myAssignmentsRequests,
    allGrowthRequests,
    refetchToAssign,
    refetchMyAssignments,
    refetchAllRequests,
    getRequestDetails: getRequestDetailsWithContext
  };
}

export const useMissionsQuery = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, name, client')
        .order('name');

      if (error) {
        console.error('Erreur lors de la récupération des missions:', error);
        throw error;
      }

      return data || [];
    },
  });
};
