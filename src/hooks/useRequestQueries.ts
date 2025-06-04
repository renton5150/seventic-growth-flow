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

  // Fonction helper pour récupérer les requêtes avec des informations de mission et profils
  const fetchRequestsWithMissionData = async (filters?: {
    assignedToIsNull?: boolean;
    workflowStatus?: string;
    workflowStatusNot?: string;
    assignedTo?: string;
    createdBy?: string;
    assignedToIsNotNull?: boolean;
  }) => {
    console.log("🚀 [fetchRequestsWithMissionData] DÉBUT avec filtres:", filters);
    
    // Utiliser la vue requests_with_missions qui contient déjà toutes les données
    let query = supabase
      .from('requests_with_missions')
      .select('*');
      
    // Appliquer les filtres de manière sécurisée
    if (filters?.assignedToIsNull) {
      query = query.is('assigned_to', null);
    }
    
    if (filters?.workflowStatus) {
      query = query.eq('workflow_status', filters.workflowStatus);
    }
    
    if (filters?.workflowStatusNot) {
      query = query.neq('workflow_status', filters.workflowStatusNot);
    }
    
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }
    
    if (filters?.assignedToIsNotNull) {
      query = query.not('assigned_to', 'is', null);
    }
    
    query = query.order('due_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error("❌ [fetchRequestsWithMissionData] ERREUR:", error);
      return [];
    }
    
    console.log(`📋 [fetchRequestsWithMissionData] ${data.length} requêtes récupérées`);
    console.log("🔍 [fetchRequestsWithMissionData] PREMIÈRE REQUÊTE BRUTE:", data[0]);
    
    // Transformer les données de la vue en format attendu
    const formattedRequests = data.map((row: any) => {
      const request = {
        id: row.id,
        title: row.title,
        type: row.type,
        status: row.status,
        createdBy: row.created_by,
        missionId: row.mission_id,
        missionName: row.mission_client || row.mission_name || "Sans mission",
        sdrName: row.sdr_name,
        assignedToName: row.assigned_to_name,
        dueDate: row.due_date,
        details: row.details || {},
        workflow_status: row.workflow_status,
        assigned_to: row.assigned_to,
        isLate: new Date(row.due_date) < new Date() && row.workflow_status !== 'completed' && row.workflow_status !== 'canceled',
        createdAt: new Date(row.created_at),
        lastUpdated: new Date(row.last_updated || row.updated_at),
        target_role: row.target_role
      } as Request;
      
      return request;
    });
    
    console.log(`✅ [fetchRequestsWithMissionData] ${formattedRequests.length} requêtes formatées`);
    console.log("🔍 [fetchRequestsWithMissionData] PREMIÈRE REQUÊTE FORMATÉE:", formattedRequests[0]);
    
    return formattedRequests;
  };

  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      return await fetchRequestsWithMissionData({
        assignedToIsNull: true,
        workflowStatus: 'pending_assignment'
      });
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      const baseFilters = {
        workflowStatusNot: 'completed'
      };
      
      if (isGrowth && !isAdmin) {
        return await fetchRequestsWithMissionData({
          ...baseFilters,
          assignedTo: userId
        });
      } else if (isSDR) {
        return await fetchRequestsWithMissionData({
          ...baseFilters,
          createdBy: userId
        });
      } else if (isAdmin) {
        return await fetchRequestsWithMissionData({
          ...baseFilters,
          assignedToIsNotNull: true
        });
      }
      
      return [];
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Toutes les requêtes
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      if (isSDR) {
        console.log('🔍 [useRequestQueries] ALL REQUESTS - SDR - Filtrage par created_by:', userId);
        return await fetchRequestsWithMissionData({
          workflowStatusNot: 'completed',
          createdBy: userId
        });
      } else {
        console.log('🔍 [useRequestQueries] ALL REQUESTS - GROWTH/ADMIN - Toutes les requêtes');
        return await fetchRequestsWithMissionData({
          workflowStatusNot: 'completed'
        });
      }
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("🔍 [useRequestQueries] REQUEST DETAILS - Récupération pour:", requestId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
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
      
      const request = {
        id: data.id,
        title: data.title,
        type: data.type,
        status: data.status,
        createdBy: data.created_by,
        missionId: data.mission_id,
        missionName: data.mission_client || data.mission_name || "Sans mission",
        sdrName: data.sdr_name,
        assignedToName: data.assigned_to_name,
        dueDate: data.due_date,
        details: data.details || {},
        workflow_status: data.workflow_status,
        assigned_to: data.assigned_to,
        isLate: new Date(data.due_date) < new Date() && data.workflow_status !== 'completed' && data.workflow_status !== 'canceled',
        createdAt: new Date(data.created_at),
        lastUpdated: new Date(data.last_updated || data.updated_at),
        target_role: data.target_role
      } as Request;
      
      console.log(`✅ [useRequestQueries] REQUEST DETAILS - Formaté: ${request.id}, missionName="${request.missionName}"`);
      
      return request;
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
