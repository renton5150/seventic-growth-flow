
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

  // Fonction helper pour récupérer les requêtes avec un JOIN direct
  const fetchRequestsWithMissions = async (whereCondition?: string, params?: any[]) => {
    console.log("🚀 [fetchRequestsWithMissions] UTILISATION DE JOIN DIRECT");
    
    // Diagnostic une seule fois
    if (!diagnosticDone) {
      await diagnoseMissionData();
      diagnosticDone = true;
    }
    
    let query = supabase
      .from('requests')
      .select(`
        id,
        title,
        type,
        created_by,
        created_at,
        mission_id,
        status,
        workflow_status,
        target_role,
        assigned_to,
        updated_at,
        details,
        last_updated,
        due_date,
        missions:mission_id (
          name,
          client
        ),
        profiles!requests_created_by_fkey (
          name
        ),
        profiles!requests_assigned_to_fkey (
          name
        )
      `);
      
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
      // Transformer les données pour correspondre au format attendu par formatRequestFromDb
      const createdByProfile = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
      const assignedToProfile = Array.isArray(request.profiles) ? request.profiles[1] : null;
      
      const transformedRequest = {
        ...request,
        mission_name: request.missions?.name || null,
        mission_client: request.missions?.client || null,
        sdr_name: createdByProfile?.name || null,
        assigned_to_name: assignedToProfile?.name || null
      };
      
      console.log(`🔧 [fetchRequestsWithMissions] Transformation de la request ${request.id}:`);
      console.log(`   - mission original:`, request.missions);
      console.log(`   - mission_name: "${transformedRequest.mission_name}"`);
      console.log(`   - mission_client: "${transformedRequest.mission_client}"`);
      
      return formatRequestFromDb(transformedRequest);
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
      console.log("🔍 [useRequestQueries] REQUEST DETAILS - Utilisation de JOIN direct pour:", requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          title,
          type,
          created_by,
          created_at,
          mission_id,
          status,
          workflow_status,
          target_role,
          assigned_to,
          updated_at,
          details,
          last_updated,
          due_date,
          missions:mission_id (
            name,
            client
          ),
          profiles!requests_created_by_fkey (
            name
          ),
          profiles!requests_assigned_to_fkey (
            name
          )
        `)
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
      
      // Transformer les données
      const createdByProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      const assignedToProfile = Array.isArray(data.profiles) ? data.profiles[1] : null;
      
      const transformedRequest = {
        ...data,
        mission_name: data.missions?.name || null,
        mission_client: data.missions?.client || null,
        sdr_name: createdByProfile?.name || null,
        assigned_to_name: assignedToProfile?.name || null
      };
      
      const formatted = await formatRequestFromDb(transformedRequest);
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
