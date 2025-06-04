
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { diagnoseMissionData } from "@/utils/diagnoseMissionData";

// Variable globale pour tracker si le diagnostic a été fait
let diagnosticDone = false;

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  console.log(`[useRequestQueries] 🚀 USER ROLE DEBUG: ${user?.role}, userId: ${userId}`);

  // Fonction helper pour récupérer les requêtes avec la vue requests_with_missions
  const fetchRequestsWithMissions = async (whereCondition?: string, params?: any[]) => {
    console.log("🚀 [fetchRequestsWithMissions] UTILISATION DE LA VUE requests_with_missions");
    
    // Diagnostic une seule fois
    if (!diagnosticDone) {
      await diagnoseMissionData();
      diagnosticDone = true;
    }
    
    let query = supabase
      .from('requests_with_missions')
      .select('*');
      
    if (whereCondition) {
      // Appliquer les conditions WHERE
      if (whereCondition.includes('assigned_to IS NULL')) {
        query = query.is('assigned_to', null);
      }
      if (whereCondition.includes('workflow_status = ?')) {
        query = query.eq('workflow_status', params?.[0] || 'pending_assignment');
      }
      if (whereCondition.includes('workflow_status != ?')) {
        query = query.neq('workflow_status', params?.[0] || 'completed');
      }
      if (whereCondition.includes('assigned_to = ?')) {
        query = query.eq('assigned_to', params?.[0]);
      }
      if (whereCondition.includes('created_by = ?')) {
        query = query.eq('created_by', params?.[0]);
      }
      if (whereCondition.includes('assigned_to IS NOT NULL')) {
        query = query.not('assigned_to', 'is', null);
      }
    }
    
    query = query.order('due_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error("❌ [fetchRequestsWithMissions] ERREUR:", error);
      return [];
    }
    
    console.log(`📋 [fetchRequestsWithMissions] ${data.length} requêtes récupérées`);
    console.log("🔍 [fetchRequestsWithMissions] DONNÉES BRUTES:", data);
    
    // Formatter les données
    const formattedRequests = await Promise.all(data.map((request: any) => {
      console.log(`🔧 [fetchRequestsWithMissions] Transformation de la request ${request.id}:`);
      console.log(`   - mission_name: "${request.mission_name}"`);
      console.log(`   - mission_client: "${request.mission_client}"`);
      console.log(`   - sdr_name: "${request.sdr_name}"`);
      console.log(`   - assigned_to_name: "${request.assigned_to_name}"`);
      
      return formatRequestFromDb(request);
    }));
    
    console.log(`✅ [fetchRequestsWithMissions] ${formattedRequests.length} requêtes formatées`);
    
    return formattedRequests;
  };

  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      return await fetchRequestsWithMissions(
        'assigned_to IS NULL AND workflow_status = ? AND workflow_status != ?',
        ['pending_assignment', 'completed']
      );
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      let whereCondition = 'workflow_status != ?';
      let params = ['completed'];
      
      if (isGrowth && !isAdmin) {
        whereCondition += ' AND assigned_to = ?';
        params.push(userId);
      } else if (isSDR) {
        whereCondition += ' AND created_by = ?';
        params.push(userId);
      } else if (isAdmin) {
        whereCondition += ' AND assigned_to IS NOT NULL';
      }
      
      return await fetchRequestsWithMissions(whereCondition, params);
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Toutes les requêtes
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      let whereCondition = 'workflow_status != ?';
      let params = ['completed'];
      
      if (isSDR) {
        whereCondition += ' AND created_by = ?';
        params.push(userId);
        console.log('🔍 [useRequestQueries] ALL REQUESTS - SDR - Filtrage par created_by:', userId);
      } else {
        console.log('🔍 [useRequestQueries] ALL REQUESTS - GROWTH/ADMIN - Toutes les requêtes');
      }
      
      return await fetchRequestsWithMissions(whereCondition, params);
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("🔍 [useRequestQueries] REQUEST DETAILS - Utilisation de la vue requests_with_missions pour:", requestId);
      
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
