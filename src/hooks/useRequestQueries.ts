import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { diagnoseMissionData } from "@/utils/diagnoseMissionData";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  console.log(`[useRequestQueries] 🚀 USER ROLE DEBUG: ${user?.role}, userId: ${userId}`);

  // DIAGNOSTIC IMMÉDIAT
  if (userId) {
    diagnoseMissionData();
  }

  // Fonction helper pour récupérer les requêtes avec des informations de mission et profils
  const fetchRequestsWithMissionData = async (whereCondition?: string, params?: any[]) => {
    console.log("🚀 [fetchRequestsWithMissionData] DÉBUT");
    
    let query = supabase
      .from('requests')
      .select(`
        *,
        missions!inner (
          id,
          name,
          client
        ),
        sdr_profile:profiles!requests_created_by_fkey (
          id,
          name
        ),
        assigned_profile:profiles!requests_assigned_to_fkey (
          id,
          name
        )
      `);
      
    if (whereCondition) {
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
      console.error("❌ [fetchRequestsWithMissionData] ERREUR:", error);
      
      // FALLBACK - essayer sans le JOIN inner si ça échoue
      console.log("🔄 [fetchRequestsWithMissionData] FALLBACK - Essai sans INNER JOIN");
      let fallbackQuery = supabase
        .from('requests')
        .select(`
          *,
          missions (
            id,
            name,
            client
          ),
          sdr_profile:profiles!requests_created_by_fkey (
            id,
            name
          ),
          assigned_profile:profiles!requests_assigned_to_fkey (
            id,
            name
          )
        `);
        
      if (whereCondition) {
        if (whereCondition.includes('assigned_to IS NULL')) {
          fallbackQuery = fallbackQuery.is('assigned_to', null);
        }
        if (whereCondition.includes('workflow_status = ?')) {
          fallbackQuery = fallbackQuery.eq('workflow_status', params?.[0] || 'pending_assignment');
        }
        if (whereCondition.includes('workflow_status != ?')) {
          fallbackQuery = fallbackQuery.neq('workflow_status', params?.[0] || 'completed');
        }
        if (whereCondition.includes('assigned_to = ?')) {
          fallbackQuery = fallbackQuery.eq('assigned_to', params?.[0]);
        }
        if (whereCondition.includes('created_by = ?')) {
          fallbackQuery = fallbackQuery.eq('created_by', params?.[0]);
        }
        if (whereCondition.includes('assigned_to IS NOT NULL')) {
          fallbackQuery = fallbackQuery.not('assigned_to', 'is', null);
        }
      }
      
      fallbackQuery = fallbackQuery.order('due_date', { ascending: true });
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        console.error("❌ [fetchRequestsWithMissionData] FALLBACK ERREUR:", fallbackError);
        return [];
      }
      
      console.log(`📋 [fetchRequestsWithMissionData] FALLBACK - ${fallbackData.length} requêtes récupérées`);
      const formattedRequests = await Promise.all(fallbackData.map(async (request: any) => {
        return await formatRequestFromDb(request);
      }));
      
      return formattedRequests;
    }
    
    console.log(`📋 [fetchRequestsWithMissionData] ${data.length} requêtes récupérées`);
    console.log("🔍 [fetchRequestsWithMissionData] PREMIÈRE REQUÊTE BRUTE:", data[0]);
    
    // Formatter les données
    const formattedRequests = await Promise.all(data.map(async (request: any) => {
      return await formatRequestFromDb(request);
    }));
    
    console.log(`✅ [fetchRequestsWithMissionData] ${formattedRequests.length} requêtes formatées`);
    console.log("🔍 [fetchRequestsWithMissionData] PREMIÈRE REQUÊTE FORMATÉE:", formattedRequests[0]);
    
    return formattedRequests;
  };

  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      return await fetchRequestsWithMissionData(
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
      
      return await fetchRequestsWithMissionData(whereCondition, params);
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
      
      return await fetchRequestsWithMissionData(whereCondition, params);
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("🔍 [useRequestQueries] REQUEST DETAILS - Récupération pour:", requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          missions (
            id,
            name,
            client
          ),
          sdr_profile:profiles!requests_created_by_fkey (
            id,
            name
          ),
          assigned_profile:profiles!requests_assigned_to_fkey (
            id,
            name
          )
        `)
        .eq('id', requestId)
        .maybeSingle();

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
