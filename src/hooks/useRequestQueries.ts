
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  // Requêtes à affecter - UNIQUEMENT les demandes sans assignation
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération des requêtes à affecter avec userId:", userId);
      console.log("Est-ce un SDR?", isSDR ? "Oui" : "Non");
      
      // Requête EXCLUSIVEMENT pour les demandes sans assignation
      let query = supabase
        .from('requests_with_missions')
        .select('*', { count: 'exact' })
        .is('assigned_to', null)
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
      console.log("Requêtes sans assignation:", data);
      return data.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });
  
  // Mes assignations - Pour Growth et Admin, voir TOUTES les requêtes
  // Pour SDR, voir uniquement mes demandes
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération de mes assignations avec userId:", userId);
      
      let query = supabase.from('requests_with_missions').select('*', { count: 'exact' });
      
      // Pour Growth: seulement les requêtes assignées à lui-même
      if (isGrowth) {
        query = query.eq('assigned_to', userId);
      }
      // Pour SDR: seulement ses requêtes créées
      else if (isSDR) {
        query = query.eq('created_by', userId);
      }
      // Pour Admin: toutes les requêtes
      
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
  
  // Toutes les requêtes - Filtre par SDR pour restreindre l'accès
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching ALL requests for dashboard with role:', isSDR ? 'SDR' : 'Admin/Growth');
      
      let query = supabase.from('requests_with_missions').select('*');
      
      // Si c'est un SDR, ne récupérer QUE ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
        console.log('SDR detected - Filtering requests for user ID:', userId);
      }
      // Pour Growth et Admin, récupérer toutes les requêtes sans filtre
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching all requests:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`Retrieved ${requestsArray.length} total requests`, isSDR ? 'for SDR' : 'for Admin/Growth');
      
      return requestsArray.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("Récupération des détails pour la demande:", requestId);
      
      // Utiliser uniquement la table requests_with_missions pour une consistance optimale
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      // Vérification des droits pour un SDR uniquement - Growth et Admin ont accès à tout
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
