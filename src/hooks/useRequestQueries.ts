
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
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("🚀 [useRequestQueries] Récupération des requêtes à affecter avec userId:", userId);
      
      // Requête pour les demandes sans assignation
      let query = supabase
        .from('requests_with_missions')
        .select('*', { count: 'exact' })
        .is('assigned_to', null)
        .eq('workflow_status', 'pending_assignment')
        .neq('workflow_status', 'completed');
      
      // Si c'est un SDR, filtrer uniquement ses requêtes
      if (isSDR) {
        query = query.eq('created_by', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("❌ [useRequestQueries] Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      console.log(`📋 [useRequestQueries] Requêtes à affecter récupérées: ${data.length} sur ${count || 'inconnu'} requêtes totales`);
      
      // Debug: Afficher les données mission pour chaque requête
      data.forEach(req => {
        console.log(`🔍 [useRequestQueries] TO ASSIGN Request ${req.id}:`, {
          mission_id: req.mission_id,
          mission_client: req.mission_client,
          mission_name: req.mission_name,
          mission_client_type: typeof req.mission_client,
          mission_client_value: JSON.stringify(req.mission_client)
        });
      });
      
      // Formater les données DIRECTEMENT sans service externe
      const formattedRequests = await Promise.all(data.map((request: any) => formatRequestFromDb(request)));
      console.log(`✅ [useRequestQueries] Requêtes à affecter formatées: ${formattedRequests.length}`);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("🚀 [useRequestQueries] Récupération de mes assignations avec userId:", userId);
      
      let query = supabase.from('requests_with_missions')
        .select('*', { count: 'exact' })
        .neq('workflow_status', 'completed');
      
      // Pour Growth: seulement les requêtes assignées à lui-même
      if (isGrowth && !isAdmin) {
        query = query.eq('assigned_to', userId);
      }
      // Pour SDR: seulement ses requêtes créées
      else if (isSDR) {
        query = query.eq('created_by', userId);
      }
      // Pour Admin: toutes les requêtes assignées
      else if (isAdmin) {
        query = query.not('assigned_to', 'is', null);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("❌ [useRequestQueries] Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      console.log(`📋 [useRequestQueries] Mes assignations récupérées: ${data.length} sur ${count || 'inconnu'} requêtes totales`);
      
      // Debug: Afficher les données mission pour chaque requête
      data.forEach(req => {
        console.log(`🔍 [useRequestQueries] MY ASSIGNMENTS Request ${req.id}:`, {
          mission_id: req.mission_id,
          mission_client: req.mission_client,
          mission_name: req.mission_name,
          mission_client_type: typeof req.mission_client,
          mission_client_value: JSON.stringify(req.mission_client)
        });
      });
      
      // Formater les données DIRECTEMENT sans service externe
      const formattedRequests = await Promise.all(data.map(request => formatRequestFromDb(request)));
      console.log(`✅ [useRequestQueries] Mes assignations formatées: ${formattedRequests.length}`);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Toutes les requêtes
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('🚀 [useRequestQueries] Récupération de TOUTES les requêtes avec rôle:', 
                  isSDR ? 'SDR' : isGrowth ? 'Growth' : 'Admin');
      
      let query = supabase.from('requests_with_missions')
        .select('*')
        .neq('workflow_status', 'completed');
      
      // Si c'est un SDR, ne récupérer QUE ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
        console.log('🔍 [useRequestQueries] SDR - Filtrage requêtes par ID utilisateur:', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [useRequestQueries] Erreur pendant la récupération des requêtes:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`📋 [useRequestQueries] ${requestsArray.length} requêtes récupérées au total`);
      
      // Debug: Afficher les données mission pour chaque requête avec plus de détails
      requestsArray.forEach(req => {
        console.log(`🔍 [useRequestQueries] ALL REQUESTS Request ${req.id}:`, {
          mission_id: req.mission_id,
          mission_client: req.mission_client,
          mission_name: req.mission_name,
          mission_client_type: typeof req.mission_client,
          mission_client_value: JSON.stringify(req.mission_client),
          mission_name_type: typeof req.mission_name,
          mission_name_value: JSON.stringify(req.mission_name)
        });
      });
      
      // Formater les données DIRECTEMENT sans service externe
      const formattedRequests = await Promise.all(requestsArray.map(request => formatRequestFromDb(request)));
      
      console.log(`✅ [useRequestQueries] ${formattedRequests.length} requêtes formatées pour l'affichage`);
      formattedRequests.forEach(req => {
        console.log(`📋 [useRequestQueries] Final Request ${req.id}: mission_id=${req.missionId}, missionName="${req.missionName}"`);
      });
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("🔍 [useRequestQueries] Récupération des détails pour la demande:", requestId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      // Vérification des droits pour un SDR uniquement
      if (data && isSDR && data.created_by !== userId) {
        console.error("❌ [useRequestQueries] SDR tentant d'accéder à une demande qui ne lui appartient pas");
        return null;
      }

      if (error) {
        console.error("❌ [useRequestQueries] Erreur lors de la récupération des détails de la demande:", error);
        return null;
      }

      if (!data) {
        console.log("⚠️ [useRequestQueries] Aucun détail trouvé pour la demande:", requestId);
        return null;
      }

      console.log("📋 [useRequestQueries] Détails de la demande récupérés:", data);
      
      // Debug: Afficher les données mission pour cette requête
      console.log(`🔍 [useRequestQueries] REQUEST DETAILS ${data.id}:`, {
        mission_id: data.mission_id,
        mission_client: data.mission_client,
        mission_name: data.mission_name,
        mission_client_type: typeof data.mission_client,
        mission_client_value: JSON.stringify(data.mission_client)
      });
      
      // Formatage DIRECTEMENT sans service externe
      const formatted = await formatRequestFromDb(data);
      console.log(`✅ [useRequestQueries] Request Details formatted: ${formatted.id}, missionName="${formatted.missionName}"`);
      
      return formatted;
    } catch (err) {
      console.error("❌ [useRequestQueries] Erreur lors de la récupération des détails:", err);
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
