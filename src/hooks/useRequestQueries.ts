
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
  const fetchRequestsWithMissionData = async (filters?: {
    assignedToIsNull?: boolean;
    workflowStatus?: string;
    workflowStatusNot?: string;
    assignedTo?: string;
    createdBy?: string;
    assignedToIsNotNull?: boolean;
  }) => {
    console.log("🚀 [fetchRequestsWithMissionData] DÉBUT avec filtres:", filters);
    
    let query = supabase
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
      
      return await fetchRequestsWithMissionData({
        assignedToIsNull: true,
        workflowStatus: 'pending_assignment',
        workflowStatusNot: 'completed'
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
