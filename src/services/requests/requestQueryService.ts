
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { getMissionById } from "@/services/missions/missionService";

interface RequestFilters {
  assignedToIsNull?: boolean;
  workflowStatus?: string;
  workflowStatusNot?: string;
  assignedTo?: string;
  createdBy?: string;
  assignedToIsNotNull?: boolean;
}

export const fetchRequests = async (filters?: RequestFilters): Promise<Request[]> => {
  console.log("🚀 [fetchRequests] Début avec filtres:", filters);
  
  try {
    // Récupérer directement depuis la table requests avec les profils
    let requestQuery = supabase
      .from('requests')
      .select(`
        *,
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `);
    
    // Appliquer les filtres
    if (filters?.assignedToIsNull) {
      requestQuery = requestQuery.is('assigned_to', null);
    }
    if (filters?.workflowStatus) {
      requestQuery = requestQuery.eq('workflow_status', filters.workflowStatus);
    }
    if (filters?.workflowStatusNot) {
      requestQuery = requestQuery.neq('workflow_status', filters.workflowStatusNot);
    }
    if (filters?.assignedTo) {
      requestQuery = requestQuery.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.createdBy) {
      requestQuery = requestQuery.eq('created_by', filters.createdBy);
    }
    if (filters?.assignedToIsNotNull) {
      requestQuery = requestQuery.not('assigned_to', 'is', null);
    }
    
    requestQuery = requestQuery.order('due_date', { ascending: true });
    
    const { data: requestsData, error: requestsError } = await requestQuery;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête requests:", requestsError);
      return [];
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées`);
    
    if (!requestsData || requestsData.length === 0) {
      console.log("⚠️ [fetchRequests] Aucune request trouvée");
      return [];
    }

    // Formater les requests avec les noms de mission
    const formattedRequests = await Promise.all(
      requestsData.map(async (request) => {
        console.log(`🔍 [fetchRequests] Formatage request ${request.id} avec mission_id: ${request.mission_id}`);
        
        // Récupérer le nom de mission via le service dédié
        const missionName = await getMissionById(request.mission_id);
        
        console.log(`✅ [fetchRequests] Mission "${missionName}" pour request ${request.id}`);
        
        // Extraire les noms des utilisateurs
        const sdrName = request.created_by_profile?.name || "Non assigné";
        const assignedToName = request.assigned_to_profile?.name || "Non assigné";
        
        const formattedRequest: Request = {
          id: request.id,
          title: request.title,
          type: request.type,
          status: request.status as RequestStatus,
          createdBy: request.created_by,
          missionId: request.mission_id,
          missionName: missionName,
          sdrName: sdrName,
          assignedToName: assignedToName,
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
      })
    );
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions`);
    
    return formattedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequests] Exception:", error);
    return [];
  }
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Récupérer la request avec les profils
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      console.error("❌ [getRequestDetails] Erreur ou pas de données:", requestError);
      return null;
    }

    if (isSDR && requestData.created_by !== userId) {
      console.error("❌ [getRequestDetails] SDR accès refusé");
      return null;
    }

    // Récupérer le nom de mission via le service dédié
    const missionName = await getMissionById(requestData.mission_id);
    
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
    
    console.log(`✅ [getRequestDetails] Request formaté: ${request.id}, mission="${request.missionName}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
