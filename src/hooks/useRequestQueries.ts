
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

  // Désactiver les hooks s'il n'y a pas d'userId pour éviter les erreurs
  const shouldFetch = !!userId && !!user;

  // Utilisation des hooks spécialisés avec des intervals plus courts pour une meilleure réactivité
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useToAssignRequests(shouldFetch ? userId : undefined);
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useMyAssignmentRequests(shouldFetch ? userId : undefined, isGrowth, isSDR, isAdmin);
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useAllRequests(shouldFetch ? userId : undefined, isSDR);

  // Wrapper pour getRequestDetails avec les paramètres du contexte et gestion d'erreurs
  const getRequestDetailsWithContext = async (requestId: string) => {
    if (!requestId || !userId || !user) {
      console.warn(`[useRequestQueries] Paramètres manquants: requestId=${requestId}, userId=${userId}, user=${!!user}`);
      return null;
    }

    try {
      console.log(`[useRequestQueries] Récupération des détails pour la demande: ${requestId}`);
      const result = await getRequestDetails(requestId, userId, isSDR);
      if (!result) {
        console.error(`[useRequestQueries] Aucun détail trouvé pour la demande: ${requestId}`);
      }
      return result;
    } catch (error) {
      console.error(`[useRequestQueries] Erreur lors de la récupération des détails de la demande ${requestId}:`, error);
      return null;
    }
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
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('id, name, client')
          .order('name');

        if (error) {
          console.error('Erreur lors de la récupération des missions:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Exception lors de la récupération des missions:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
};
