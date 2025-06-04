
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

  console.log(`[useRequestQueries] 🚀 USER ROLE DEBUG: ${user?.role}, userId: ${userId}`);

  // Requêtes à affecter - UTILISATION DIRECTE DE requests_with_missions
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("🚀 [useRequestQueries] TO ASSIGN - Utilisation de requests_with_missions");
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .is('assigned_to', null)
        .eq('workflow_status', 'pending_assignment')
        .neq('workflow_status', 'completed')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("❌ [useRequestQueries] TO ASSIGN - Erreur:", error);
        return [];
      }
      
      console.log(`📋 [useRequestQueries] TO ASSIGN - ${data.length} requêtes récupérées`);
      console.log("🔍 [useRequestQueries] TO ASSIGN - Exemple de données:", data[0]);
      
      const formattedRequests = await Promise.all(data.map((request: any) => {
        return formatRequestFromDb(request);
      }));
      
      console.log(`✅ [useRequestQueries] TO ASSIGN - ${formattedRequests.length} requêtes formatées`);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations - UTILISATION DIRECTE DE requests_with_missions
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("🚀 [useRequestQueries] MY ASSIGNMENTS - Utilisation de requests_with_missions");
      
      let query = supabase
        .from('requests_with_missions')
        .select('*')
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
      
      const { data, error } = await query;
      
      if (error) {
        console.error("❌ [useRequestQueries] MY ASSIGNMENTS - Erreur:", error);
        return [];
      }
      
      console.log(`📋 [useRequestQueries] MY ASSIGNMENTS - ${data.length} requêtes récupérées`);
      console.log("🔍 [useRequestQueries] MY ASSIGNMENTS - Exemple de données:", data[0]);
      
      const formattedRequests = await Promise.all(data.map((request: any) => {
        return formatRequestFromDb(request);
      }));
      
      console.log(`✅ [useRequestQueries] MY ASSIGNMENTS - ${formattedRequests.length} requêtes formatées`);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Toutes les requêtes - UTILISATION DIRECTE DE requests_with_missions
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('🚀 [useRequestQueries] ALL REQUESTS - Utilisation de requests_with_missions');
      
      let query = supabase
        .from('requests_with_missions')
        .select('*')
        .neq('workflow_status', 'completed');
      
      // Si c'est un SDR, ne récupérer QUE ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
        console.log('🔍 [useRequestQueries] ALL REQUESTS - SDR - Filtrage par created_by:', userId);
      } else {
        console.log('🔍 [useRequestQueries] ALL REQUESTS - GROWTH/ADMIN - Toutes les requêtes');
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [useRequestQueries] ALL REQUESTS - Erreur:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`📋 [useRequestQueries] ALL REQUESTS - ${requestsArray.length} requêtes récupérées pour rôle ${user?.role}`);
      console.log("🔍 [useRequestQueries] ALL REQUESTS - Exemple de données:", requestsArray[0]);
      
      const formattedRequests = await Promise.all(requestsArray.map((request: any) => {
        return formatRequestFromDb(request);
      }));
      
      console.log(`✅ [useRequestQueries] ALL REQUESTS - ${formattedRequests.length} requêtes formatées pour rôle ${user?.role}`);
      formattedRequests.forEach(req => {
        console.log(`📋 [useRequestQueries] ALL REQUESTS FINAL - Request ${req.id}: mission_id=${req.missionId}, missionName="${req.missionName}"`);
      });
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("🔍 [useRequestQueries] REQUEST DETAILS - Utilisation de requests_with_missions pour:", requestId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      // Vérification des droits pour un SDR uniquement
      if (data && isSDR && data.created_by !== userId) {
        console.error("❌ [useRequestQueries] REQUEST DETAILS - SDR accès refusé");
        return null;
      }

      if (error) {
        console.error("❌ [useRequestQueries] REQUEST DETAILS - Erreur:", error);
        return null;
      }

      if (!data) {
        console.log("⚠️ [useRequestQueries] REQUEST DETAILS - Aucune donnée pour:", requestId);
        return null;
      }

      console.log("📋 [useRequestQueries] REQUEST DETAILS - Données récupérées:", data);
      
      const formatted = await formatRequestFromDb(data);
      console.log(`✅ [useRequestQueries] REQUEST DETAILS - Formaté: ${formatted.id}, missionName="${formatted.missionName}"`);
      
      return formatted;
    } catch (err) {
      console.error("❌ [useRequestQueries] REQUEST DETAILS - Exception:", err);
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
