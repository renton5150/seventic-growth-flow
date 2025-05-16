
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { getMissionsByGrowthId } from "@/services/missions-service/operations/readMissions";

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
      // Si c'est un Growth, filtrer pour voir uniquement les missions qui lui sont assignées
      else if (isGrowth && !isAdmin) {
        try {
          // Récupérer d'abord les missions assignées à ce Growth
          const growthMissions = await getMissionsByGrowthId(userId);
          console.log("Growth missions fetched for filtering requests:", growthMissions);
          
          const missionIds = growthMissions.map(mission => mission.id);
          console.log("Mission IDs for filtering:", missionIds);
          
          // S'il y a des missions, filtrer par ces ID
          if (missionIds.length > 0) {
            query = query.in('mission_id', missionIds);
          } else {
            console.log("No mission IDs found for Growth user, may result in empty requests list");
          }
        } catch (err) {
          console.error("Error while fetching growth missions for filtering:", err);
        }
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
    enabled: !!userId,
    refetchInterval: 10000 // Rafraîchir toutes les 10 secondes
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
        try {
          // Pour un utilisateur Growth, on veut les requêtes qui:
          // 1. Sont directement assignées à lui-même OU
          // 2. Sont associées aux missions dont il est responsable
          const growthMissions = await getMissionsByGrowthId(userId);
          console.log("Growth missions for my assignments:", growthMissions);
          
          const missionIds = growthMissions.map(mission => mission.id);
          console.log("Mission IDs for my assignments:", missionIds);
          
          if (missionIds.length > 0) {
            query = query.or(`assigned_to.eq.${userId},mission_id.in.(${missionIds.join(',')})`);
          } else {
            console.log("No missions found for growth user, falling back to assigned_to only");
            query = query.eq('assigned_to', userId);
          }
        } catch (err) {
          console.error("Error while fetching growth missions for my assignments:", err);
          query = query.eq('assigned_to', userId);
        }
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
    enabled: !!userId,
    refetchInterval: 10000 // Rafraîchir toutes les 10 secondes
  });
  
  // Toutes les requêtes - Filtre par SDR pour restreindre l'accès
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching ALL requests for dashboard with role:', 
                  isSDR ? 'SDR' : isGrowth ? 'Growth' : 'Admin');
      
      let query = supabase.from('requests_with_missions').select('*');
      
      // Si c'est un SDR, ne récupérer QUE ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
        console.log('SDR detected - Filtering requests for user ID:', userId);
      }
      // Si c'est un Growth, récupérer les requêtes associées à ses missions
      else if (isGrowth && !isAdmin) {
        console.log('Growth detected - Filtering requests for user ID:', userId);
        try {
          const growthMissions = await getMissionsByGrowthId(userId);
          console.log("Growth missions for all requests:", growthMissions);
          
          const missionIds = growthMissions.map(mission => mission.id);
          console.log("Mission IDs for all requests:", missionIds);
          
          if (missionIds.length > 0) {
            query = query.or(`assigned_to.eq.${userId},mission_id.in.(${missionIds.join(',')})`);
          } else {
            console.log("No missions found for growth user, falling back to assigned_to only");
            query = query.eq('assigned_to', userId);
          }
        } catch (err) {
          console.error("Error while fetching growth missions for all requests:", err);
          query = query.eq('assigned_to', userId);
        }
      }
      // Pour Admin, récupérer toutes les requêtes sans filtre
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching all requests:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`Retrieved ${requestsArray.length} total requests`, 
                  isSDR ? 'for SDR' : isGrowth ? 'for Growth' : 'for Admin');
      
      return requestsArray.map(request => formatRequestFromDb(request));
    },
    enabled: !!userId,
    refetchInterval: 10000 // Rafraîchir toutes les 10 secondes
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
