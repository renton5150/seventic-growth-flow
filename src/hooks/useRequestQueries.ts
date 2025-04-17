
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";

export function useRequestQueries(userId: string | undefined) {
  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign'],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération des requêtes à affecter pour Growth avec userId:", userId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('workflow_status', 'pending_assignment')
        .eq('target_role', 'growth')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      console.log("Requêtes à affecter récupérées:", data);
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments'],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération de mes assignations pour Growth avec userId:", userId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      console.log("Mes assignations récupérées:", data);
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Toutes les requêtes pour le rôle growth - modification pour voir TOUTES les requêtes ciblées pour Growth
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests'],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération de toutes les requêtes growth avec userId:", userId);
      
      // Utiliser la vue requests_with_missions et récupérer toutes les requêtes ciblées pour le rôle growth
      // Nous ne filtrons plus par assigned_to pour voir toutes les demandes
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('target_role', 'growth')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération de toutes les requêtes:", error);
        return [];
      }
      
      console.log("Toutes les requêtes récupérées:", data?.length || 0);
      
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("Récupération des détails pour la demande:", requestId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération des détails de la demande:", error);
        return null;
      }

      console.log("Détails de la demande récupérés:", data);
      return formatRequestFromDb(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
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
    getRequestDetails
  };
}
