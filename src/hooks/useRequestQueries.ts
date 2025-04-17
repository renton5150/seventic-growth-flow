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
      
      const { data, error, count } = await supabase
        .from('growth_requests_view')
        .select('*', { count: 'exact' })
        .eq('workflow_status', 'pending_assignment')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      console.log(`Requêtes à affecter récupérées: ${data.length} sur ${count} requêtes totales dans la vue`);
      console.log("IDs des requêtes à affecter:", data.map(r => r.id));
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
      
      const { data, error, count } = await supabase
        .from('growth_requests_view')
        .select('*', { count: 'exact' })
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      console.log(`Mes assignations récupérées: ${data.length} sur ${count} requêtes totales dans la vue`);
      console.log("IDs de mes assignations:", data.map(r => r.id));
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Toutes les requêtes pour le rôle growth
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests'],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching ALL requests for Growth dashboard');
      
      // Solution radicale : récupérer TOUTES les demandes sans exception
      const { data, error } = await supabase
        .rpc('get_all_requests');
      
      if (error) {
        console.error('Error fetching all requests:', error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length} total requests`);
      return data.map(request => formatRequestFromDb(request)) || [];
    },
    enabled: !!userId
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("Récupération des détails pour la demande:", requestId);
      
      // Essayer d'abord avec la vue growth_requests_view
      let { data, error } = await supabase
        .from('growth_requests_view')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      // Si pas trouvé, essayer avec la table requests_with_missions
      if (!data && !error) {
        console.log("Requête non trouvée dans la vue, essai avec la table requests_with_missions");
        const response = await supabase
          .from('requests_with_missions')
          .select('*')
          .eq('id', requestId)
          .maybeSingle();
          
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error("Erreur lors de la récupération des détails de la demande:", error);
        return null;
      }

      if (!data) {
        console.log("Aucun détail trouvé pour la demande:", requestId);
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
