
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

interface RequestFilters {
  assignedToIsNull?: boolean;
  workflowStatus?: string;
  workflowStatusNot?: string;
  assignedTo?: string;
  createdBy?: string;
  assignedToIsNotNull?: boolean;
}

export const fetchRequests = async (filters?: RequestFilters): Promise<Request[]> => {
  console.log("🚀 [fetchRequests] Début - VERSION ULTRA SIMPLE");
  
  try {
    // Récupérer TOUT en une seule requête avec JOIN explicite
    let query = supabase
      .from('requests')
      .select(`
        *,
        missions!inner(id, name, client),
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
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées avec missions`);
    
    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    // Formater simplement
    const formattedRequests = requestsData.map((request) => {
      // Mission name - logique ultra simple
      let missionName = "Sans mission";
      if (request.missions) {
        if (request.missions.client && request.missions.client.trim()) {
          missionName = request.missions.client.trim();
        } else if (request.missions.name && request.missions.name.trim()) {
          missionName = request.missions.name.trim();
        }
      }
      
      console.log(`✅ [fetchRequests] Request ${request.id} -> Mission: "${missionName}"`);
      
      const formattedRequest: Request = {
        id: request.id,
        title: request.title,
        type: request.type,
        status: request.status as RequestStatus,
        createdBy: request.created_by,
        missionId: request.mission_id,
        missionName: missionName,
        sdrName: request.created_by_profile?.name || "Non assigné",
        assignedToName: request.assigned_to_profile?.name || "Non assigné",
        dueDate: request.due_date,
        details: request.details || {},
        workflow_status: request.workflow_status as WorkflowStatus,
        assigned_to: request.assigned_to,
        isLate: new Date(request.due_date) < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled',
        createdAt: new Date(request.created_at),
        lastUpdated: new Date(request.last_updated || request.updated_at),
        target_role: request.target_role
      };
      
      return formattedRequest;
    });
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées - TERMINÉ`);
    
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
        missions!inner(id, name, client),
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

    // Mission name - même logique simple
    let missionName = "Sans mission";
    if (requestData.missions) {
      if (requestData.missions.client && requestData.missions.client.trim()) {
        missionName = requestData.missions.client.trim();
      } else if (requestData.missions.name && requestData.missions.name.trim()) {
        missionName = requestData.missions.name.trim();
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
      sdrName: requestData.created_by_profile?.name || "Non assigné",
      assignedToName: requestData.assigned_to_profile?.name || "Non assigné",
      dueDate: requestData.due_date,
      details: requestData.details || {},
      workflow_status: requestData.workflow_status as WorkflowStatus,
      assigned_to: requestData.assigned_to,
      isLate: new Date(requestData.due_date) < new Date() && requestData.workflow_status !== 'completed' && requestData.workflow_status !== 'canceled',
      createdAt: new Date(requestData.created_at),
      lastUpdated: new Date(requestData.last_updated || requestData.updated_at),
      target_role: requestData.target_role
    };
    
    console.log(`✅ [getRequestDetails] Request: ${request.id}, mission="${request.missionName}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
