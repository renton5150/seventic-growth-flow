
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";

export function useRequestQueries(userId: string | undefined) {
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign'],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          created_by_profile:created_by(name, avatar),
          assigned_profile:assigned_to(name, avatar)
        `)
        .eq('workflow_status', 'pending_assignment')
        .eq('target_role', 'growth')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      return data.map(formatRequestFromDb);
    },
    enabled: !!userId
  });
  
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments'],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          created_by_profile:created_by(name, avatar),
          assigned_profile:assigned_to(name, avatar),
          missions:mission_id(name)
        `)
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      return data.map(formatRequestFromDb);
    },
    enabled: !!userId
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          created_by_profile:created_by(name, avatar),
          assigned_profile:assigned_to(name, avatar),
          missions:mission_id(name)
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération des détails de la demande:", error);
        return null;
      }

      return formatRequestFromDb(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
      return null;
    }
  };

  return {
    toAssignRequests,
    myAssignmentsRequests,
    refetchToAssign,
    refetchMyAssignments,
    getRequestDetails
  };
}
