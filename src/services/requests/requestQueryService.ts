
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { getDirectMissionById } from "@/services/missions/directMissionService";

interface RequestFilters {
  assignedToIsNull?: boolean;
  workflowStatus?: string;
  workflowStatusNot?: string;
  assignedTo?: string;
  createdBy?: string;
  assignedToIsNotNull?: boolean;
}

export const fetchRequests = async (filters?: RequestFilters): Promise<Request[]> => {
  console.log("🚀 [fetchRequests] Début - Récupération avec résolution COMPLÈTE missions");
  
  try {
    // Récupérer TOUT en une seule requête avec JOIN explicite
    let query = supabase
      .from('requests')
      .select(`
        *,
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
    
    const { data: requestsData, error: requestsError } = await query;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête:", requestsError);
      return [];
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées`);
    
    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    // Résoudre les noms de missions pour chaque requête
    const formattedRequests = await Promise.all(requestsData.map(async (request) => {
      // Résoudre le nom de mission ET le client via le service direct
      let missionName = "Sans mission";
      let missionClient = "Sans client";
      
      if (request.mission_id) {
        try {
          const missionData = await getDirectMissionById(request.mission_id);
          missionName = missionData.name;
          missionClient = missionData.client;
        } catch (error) {
          console.error(`Erreur résolution mission ${request.mission_id}:`, error);
        }
      }
      
      console.log(`✅ [fetchRequests] Request ${request.id} -> Mission: "${missionName}", Client: "${missionClient}"`);
      
      // Gérer correctement les détails JSON
      let details: Record<string, any> = {};
      if (request.details) {
        if (typeof request.details === 'string') {
          try {
            details = JSON.parse(request.details);
          } catch (e) {
            details = {};
          }
        } else if (typeof request.details === 'object' && request.details !== null) {
          details = request.details as Record<string, any>;
        }
      }
      
      const formattedRequest: Request = {
        id: request.id,
        title: request.title,
        type: request.type,
        status: request.status as RequestStatus,
        createdBy: request.created_by,
        missionId: request.mission_id,
        missionName: missionName,
        missionClient: missionClient, // AJOUTER le client de mission
        sdrName: request.created_by_profile?.name || "Non assigné",
        assignedToName: request.assigned_to_profile?.name || "Non assigné",
        dueDate: request.due_date,
        details: details,
        workflow_status: request.workflow_status as WorkflowStatus,
        assigned_to: request.assigned_to,
        isLate: new Date(request.due_date) < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled',
        createdAt: new Date(request.created_at),
        lastUpdated: new Date(request.last_updated || request.updated_at),
        target_role: request.target_role
      };
      
      return formattedRequest;
    }));
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions ET clients résolus`);
    
    return formattedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequests] Exception:", error);
    return [];
  }
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Récupérer avec JOIN explicite
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (requestError || !requestData) {
      console.error("❌ [getRequestDetails] Erreur:", requestError);
      return null;
    }

    if (isSDR && requestData.created_by !== userId) {
      console.error("❌ [getRequestDetails] SDR accès refusé");
      return null;
    }

    // Résoudre le nom de mission ET le client via le service direct
    let missionName = "Sans mission";
    let missionClient = "Sans client";
    
    if (requestData.mission_id) {
      try {
        const missionData = await getDirectMissionById(requestData.mission_id);
        missionName = missionData.name;
        missionClient = missionData.client;
      } catch (error) {
        console.error(`Erreur résolution mission ${requestData.mission_id}:`, error);
      }
    }
    
    // Gérer correctement les détails JSON
    let details: Record<string, any> = {};
    if (requestData.details) {
      if (typeof requestData.details === 'string') {
        try {
          details = JSON.parse(requestData.details);
        } catch (e) {
          details = {};
        }
      } else if (typeof requestData.details === 'object' && requestData.details !== null) {
        details = requestData.details as Record<string, any>;
      }
    }
    
    const request: Request = {
      id: requestData.id,
      title: requestData.title,
      type: requestData.type,
      status: requestData.status as RequestStatus,
      createdBy: requestData.created_by,
      missionId: requestData.mission_id,
      missionName: missionName,
      missionClient: missionClient, // AJOUTER le client de mission
      sdrName: requestData.created_by_profile?.name || "Non assigné",
      assignedToName: requestData.assigned_to_profile?.name || "Non assigné",
      dueDate: requestData.due_date,
      details: details,
      workflow_status: requestData.workflow_status as WorkflowStatus,
      assigned_to: requestData.assigned_to,
      isLate: new Date(requestData.due_date) < new Date() && requestData.workflow_status !== 'completed' && requestData.workflow_status !== 'canceled',
      createdAt: new Date(requestData.created_at),
      lastUpdated: new Date(requestData.last_updated || requestData.updated_at),
      target_role: requestData.target_role
    };
    
    console.log(`✅ [getRequestDetails] Request: ${request.id}, mission="${request.missionName}", client="${request.missionClient}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
