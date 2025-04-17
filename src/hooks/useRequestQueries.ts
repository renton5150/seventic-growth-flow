
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
      
      console.log("Récupération de toutes les requêtes growth avec userId:", userId);
      
      // Activer le debug pour voir la requête SQL exacte
      const debugSupabase = supabase.debug();
      
      // Obtenir d'abord le nombre total de requêtes dans la table requests
      const { count: totalRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Nombre total de requêtes dans la table 'requests': ${totalRequestsCount}`);
      
      // Obtenir le nombre total de requêtes dans la vue growth_requests_view
      const { count: totalGrowthRequestsCount } = await supabase
        .from('growth_requests_view')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Nombre total de requêtes dans la vue 'growth_requests_view': ${totalGrowthRequestsCount}`);
      
      // Vérifier si team_relations contient des données
      const { data: teamRelations, count: teamRelationsCount } = await supabase
        .from('team_relations')
        .select('*', { count: 'exact' });
      
      console.log(`Relations d'équipe trouvées: ${teamRelationsCount}`);
      if (teamRelationsCount && teamRelationsCount > 0) {
        console.log("Exemple de relations d'équipe:", teamRelations?.[0]);
      }
      
      // Vérifier si les missions ont des growth_id assignés
      const { data: missionsWithGrowth, count: missionsWithGrowthCount } = await supabase
        .from('missions')
        .select('id, name, growth_id', { count: 'exact' })
        .not('growth_id', 'is', null);
      
      console.log(`Missions avec growth_id assigné: ${missionsWithGrowthCount}`);
      if (missionsWithGrowthCount && missionsWithGrowthCount > 0) {
        console.log("Exemple de mission avec growth_id:", missionsWithGrowth?.[0]);
      }
      
      // Récupérer toutes les requêtes de la vue growth_requests_view
      const { data, error, count } = await debugSupabase
        .from('growth_requests_view')
        .select('*', { count: 'exact' })
        .order('due_date', { ascending: true });
      
      // Désactiver le debug
      debugSupabase.end();
      
      if (error) {
        console.error("Erreur lors de la récupération de toutes les requêtes:", error);
        return [];
      }
      
      console.log(`Nombre total de requêtes récupérées: ${data?.length || 0} sur ${count} requêtes dans la vue`);
      
      // SOLUTION TEMPORAIRE: Si la vue ne retourne pas de données, récupérer toutes les requêtes directement de la table requests
      if (!data || data.length === 0) {
        console.log("SOLUTION TEMPORAIRE: Récupération de toutes les requêtes de la table requests");
        
        const { data: allRequests, error: allRequestsError } = await supabase
          .from('requests_with_missions')
          .select('*')
          .order('due_date', { ascending: true });
        
        if (allRequestsError) {
          console.error("Erreur lors de la récupération de toutes les requêtes (fallback):", allRequestsError);
          return [];
        }
        
        console.log(`SOLUTION TEMPORAIRE: ${allRequests?.length || 0} requêtes récupérées directement de la table requests`);
        return (allRequests || []).map(request => formatRequestFromDb(request));
      }
      
      console.log("IDs des requêtes récupérées:", data.map(r => r.id));
      return data.map(request => formatRequestFromDb(request));
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
