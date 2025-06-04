
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  console.log(`[useRequestQueries] USER ROLE: ${user?.role}, userId: ${userId}`);

  // Fonction simple pour récupérer les requests avec missions
  const fetchRequests = async (filters?: {
    assignedToIsNull?: boolean;
    workflowStatus?: string;
    workflowStatusNot?: string;
    assignedTo?: string;
    createdBy?: string;
    assignedToIsNotNull?: boolean;
  }) => {
    console.log("🚀 Récupération requests avec filtres:", filters);
    
    let query = supabase
      .from('requests')
      .select(`
        *,
        missions!inner(name, client),
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `);
      
    // Appliquer les filtres
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
      console.error("❌ Erreur:", error);
      return [];
    }
    
    console.log(`📋 ${data.length} requests récupérées`);
    
    // Transformation simple et directe
    const requests = data.map((row: any) => {
      const missionName = row.missions?.client || row.missions?.name || "Sans mission";
      const sdrName = row.created_by_profile?.name || "Non assigné";
      const assignedToName = row.assigned_to_profile?.name || "Non assigné";
      
      return {
        id: row.id,
        title: row.title,
        type: row.type,
        status: row.status,
        createdBy: row.created_by,
        missionId: row.mission_id,
        missionName: missionName,
        sdrName: sdrName,
        assignedToName: assignedToName,
        dueDate: row.due_date,
        details: row.details || {},
        workflow_status: row.workflow_status,
        assigned_to: row.assigned_to,
        isLate: new Date(row.due_date) < new Date() && row.workflow_status !== 'completed' && row.workflow_status !== 'canceled',
        createdAt: new Date(row.created_at),
        lastUpdated: new Date(row.last_updated || row.updated_at),
        target_role: row.target_role
      } as Request;
    });
    
    console.log(`✅ ${requests.length} requests formatées`);
    console.log("🔍 Premier request:", requests[0]);
    
    return requests;
  };

  // Requêtes à affecter
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['requests-to-assign', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await fetchRequests({
        assignedToIsNull: true,
        workflowStatus: 'pending_assignment'
      });
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['requests-my-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (isGrowth && !isAdmin) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          assignedTo: userId
        });
      } else if (isSDR) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          createdBy: userId
        });
      } else if (isAdmin) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
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
    queryKey: ['requests-all', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      if (isSDR) {
        return await fetchRequests({
          workflowStatusNot: 'completed',
          createdBy: userId
        });
      } else {
        return await fetchRequests({
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
      console.log("🔍 Récupération détails pour:", requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          missions(name, client),
          created_by_profile:profiles!requests_created_by_fkey(name),
          assigned_to_profile:profiles!requests_assigned_to_fkey(name)
        `)
        .eq('id', requestId)
        .maybeSingle();

      if (data && isSDR && data.created_by !== userId) {
        console.error("❌ SDR accès refusé");
        return null;
      }

      if (error) {
        console.error("❌ Erreur:", error);
        return null;
      }

      if (!data) {
        console.log("⚠️ Aucune donnée pour:", requestId);
        return null;
      }

      const missionName = data.missions?.client || data.missions?.name || "Sans mission";
      const sdrName = data.created_by_profile?.name || "Non assigné";
      const assignedToName = data.assigned_to_profile?.name || "Non assigné";
      
      const request = {
        id: data.id,
        title: data.title,
        type: data.type,
        status: data.status,
        createdBy: data.created_by,
        missionId: data.mission_id,
        missionName: missionName,
        sdrName: sdrName,
        assignedToName: assignedToName,
        dueDate: data.due_date,
        details: data.details || {},
        workflow_status: data.workflow_status,
        assigned_to: data.assigned_to,
        isLate: new Date(data.due_date) < new Date() && data.workflow_status !== 'completed' && data.workflow_status !== 'canceled',
        createdAt: new Date(data.created_at),
        lastUpdated: new Date(data.last_updated || data.updated_at),
        target_role: data.target_role
      } as Request;
      
      console.log(`✅ Request détails formaté: ${request.id}, mission="${request.missionName}"`);
      
      return request;
    } catch (err) {
      console.error("❌ Exception:", err);
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
