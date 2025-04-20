
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';

  // Requêtes à affecter - Modifications pour les SDRs
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération des requêtes à affecter avec userId:", userId);
      
      let query = supabase
        .from('requests_with_missions')
        .select('*', { count: 'exact' })
        .eq('workflow_status', 'pending_assignment');
      
      // Si c'est un SDR, filtrer uniquement ses requêtes
      if (isSDR) {
        query = query.eq('created_by', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      console.log(`Requêtes à affecter récupérées: ${data.length} sur ${count} requêtes totales dans la vue`);
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Mes assignations - Afficher uniquement les demandes du SDR connecté ou assignées au Growth
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération de mes assignations avec userId:", userId);
      
      let query = supabase.from('requests_with_missions').select('*', { count: 'exact' });
      
      // Si c'est un SDR, montrer uniquement ses propres demandes
      if (isSDR) {
        query = query.eq('created_by', userId);
      } else if (isGrowth) {
        // Pour Growth, montrer les demandes qui lui sont assignées
        query = query.eq('assigned_to', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      console.log(`Mes assignations récupérées: ${data.length} sur ${count} requêtes totales dans la vue`);
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Toutes les requêtes - Pas de filtre pour Growth
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching ALL requests for dashboard with role:', isSDR ? 'SDR' : 'Admin/Growth');
      
      let query = supabase.from('requests_with_missions').select('*');
      
      // Si c'est un SDR, ne récupérer que ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
      }
      // Pour Growth et Admin, récupérer toutes les requêtes sans filtre
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching all requests:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`Retrieved ${requestsArray.length} total requests`);
      
      return requestsArray.map(request => formatRequestFromDb(request));
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

      // Vérification des droits pour un SDR
      if (data && isSDR && data.created_by !== userId) {
        console.error("SDR tentant d'accéder à une demande qui ne lui appartient pas");
        return null;
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
