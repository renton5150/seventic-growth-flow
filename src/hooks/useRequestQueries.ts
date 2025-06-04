
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

  // Fonction helper pour récupérer les requêtes avec JOIN direct vers missions et profiles
  const fetchRequestsWithDirectJoin = async (whereCondition?: string, params?: any[]) => {
    console.log("🚀 [fetchRequestsWithDirectJoin] UTILISATION DE JOINS DIRECTS");
    
    let query = supabase
      .from('requests')
      .select(`
        *,
        missions!requests_mission_id_fkey (
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
      console.error("❌ [fetchRequestsWithDirectJoin] ERREUR:", error);
      return [];
    }
    
    console.log(`📋 [fetchRequestsWithDirectJoin] ${data.length} requêtes récupérées`);
    console.log("🔍 [fetchRequestsWithDirectJoin] DONNÉES BRUTES:", data);
    
    // Formatter les données avec les informations de mission et profiles
    const formattedRequests = await Promise.all(data.map((request: any) => {
      console.log(`🔧 [fetchRequestsWithDirectJoin] Transformation de la request ${request.id}:`);
      
      // Extraire les données de mission
      let missionName = "Sans mission";
      if (request.missions) {
        if (request.missions.client && request.missions.client.trim() !== "") {
          missionName = request.missions.client.trim();
          console.log(`   - mission client: "${missionName}"`);
        } else if (request.missions.name && request.missions.name.trim() !== "") {
          missionName = request.missions.name.trim();
          console.log(`   - mission name: "${missionName}"`);
        }
      }
      
      // Extraire les noms des profiles
      const sdrName = request.sdr_profile?.name || null;
      const assignedToName = request.assigned_profile?.name || null;
      
      console.log(`   - sdr_name: "${sdrName}"`);
      console.log(`   - assigned_to_name: "${assignedToName}"`);
      
      // Enrichir l'objet request avec les données formatées
      const enrichedRequest = {
        ...request,
        mission_name: missionName,
        mission_client: missionName,
        sdr_name: sdrName,
        assigned_to_name: assignedToName
      };
      
      return formatRequestFromDb(enrichedRequest);
    }));
    
    console.log(`✅ [fetchRequestsWithDirectJoin] ${formattedRequests.length} requêtes formatées`);
    
    return formattedRequests;
  };

  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      return await fetchRequestsWithDirectJoin(
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
      
      return await fetchRequestsWithDirectJoin(whereCondition, params);
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
      
      return await fetchRequestsWithDirectJoin(whereCondition, params);
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
          *,
          missions!requests_mission_id_fkey (
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
      
      // Enrichir avec les données de mission et profiles
      let missionName = "Sans mission";
      if (data.missions) {
        if (data.missions.client && data.missions.client.trim() !== "") {
          missionName = data.missions.client.trim();
        } else if (data.missions.name && data.missions.name.trim() !== "") {
          missionName = data.missions.name.trim();
        }
      }
      
      const enrichedData = {
        ...data,
        mission_name: missionName,
        mission_client: missionName,
        sdr_name: data.sdr_profile?.name || null,
        assigned_to_name: data.assigned_profile?.name || null
      };
      
      const formatted = await formatRequestFromDb(enrichedData);
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
