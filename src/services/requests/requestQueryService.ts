
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
  console.log("🚀 [fetchRequests] Début avec filtres:", filters);
  
  try {
    // Utiliser la vue requests_with_missions qui contient déjà les données enrichies
    let query = supabase
      .from('requests_with_missions')
      .select('*');
    
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
    
    console.log("📋 [fetchRequests] Exécution de la requête sur requests_with_missions...");
    
    const { data: requestsData, error: requestsError } = await query;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête requests_with_missions:", requestsError);
      
      // Fallback: utiliser la table requests de base si la vue échoue
      console.log("🔄 [fetchRequests] Fallback vers la table requests de base...");
      return await fetchRequestsFallback(filters);
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées depuis requests_with_missions`);
    
    if (!requestsData || requestsData.length === 0) {
      console.log("⚠️ [fetchRequests] Aucune donnée retournée");
      return [];
    }

    // Formatter les données récupérées
    const formattedRequests = requestsData.map((request) => {
      console.log(`🔍 [fetchRequests] Formatage request ${request.id} avec mission: "${request.mission_name || request.mission_client || 'Sans mission'}"`);
      
      // Priorité: mission_client > mission_name > "Sans mission"
      const missionName = request.mission_client || request.mission_name || "Sans mission";
      
      const formattedRequest: Request = {
        id: request.id,
        title: request.title,
        type: request.type,
        status: request.status as RequestStatus,
        createdBy: request.created_by,
        missionId: request.mission_id,
        missionName: missionName,
        sdrName: request.sdr_name || "Non assigné",
        assignedToName: request.assigned_to_name || "Non assigné",
        dueDate: request.due_date,
        details: request.details || {},
        workflow_status: request.workflow_status as WorkflowStatus,
        assigned_to: request.assigned_to,
        isLate: new Date(request.due_date) < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled',
        createdAt: new Date(request.created_at),
        lastUpdated: new Date(request.last_updated || request.updated_at),
        target_role: request.target_role
      };
      
      console.log(`✅ [fetchRequests] Request formatée: ${formattedRequest.id}, mission="${formattedRequest.missionName}"`);
      
      return formattedRequest;
    });
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions`);
    console.log(`🔍 [fetchRequests] Exemple de missions récupérées:`, formattedRequests.slice(0, 3).map(r => ({ id: r.id, missionName: r.missionName })));
    
    return formattedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequests] Exception:", error);
    
    // Fallback en cas d'exception
    console.log("🔄 [fetchRequests] Fallback vers la méthode de base suite à exception...");
    return await fetchRequestsFallback(filters);
  }
};

// Fonction fallback pour utiliser la table requests de base
const fetchRequestsFallback = async (filters?: RequestFilters): Promise<Request[]> => {
  try {
    console.log("🔄 [fetchRequestsFallback] Utilisation de la table requests de base");
    
    let baseQuery = supabase
      .from('requests')
      .select('*');
    
    // Appliquer les filtres sur la table requests
    if (filters?.assignedToIsNull) {
      baseQuery = baseQuery.is('assigned_to', null);
    }
    if (filters?.workflowStatus) {
      baseQuery = baseQuery.eq('workflow_status', filters.workflowStatus);
    }
    if (filters?.workflowStatusNot) {
      baseQuery = baseQuery.neq('workflow_status', filters.workflowStatusNot);
    }
    if (filters?.assignedTo) {
      baseQuery = baseQuery.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.createdBy) {
      baseQuery = baseQuery.eq('created_by', filters.createdBy);
    }
    if (filters?.assignedToIsNotNull) {
      baseQuery = baseQuery.not('assigned_to', 'is', null);
    }
    
    baseQuery = baseQuery.order('due_date', { ascending: true });
    
    const { data: requestsData, error: requestsError } = await baseQuery;
    
    if (requestsError) {
      console.error("❌ [fetchRequestsFallback] Erreur requête de base:", requestsError);
      return [];
    }
    
    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    // Formater sans enrichissement complexe pour éviter les erreurs 406
    const formattedRequests = requestsData.map((request) => {
      const formattedRequest: Request = {
        id: request.id,
        title: request.title,
        type: request.type,
        status: request.status as RequestStatus,
        createdBy: request.created_by,
        missionId: request.mission_id,
        missionName: "Sans mission", // Valeur par défaut en cas de fallback
        sdrName: "Non assigné",
        assignedToName: "Non assigné",
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
    
    console.log(`✅ [fetchRequestsFallback] ${formattedRequests.length} requests formatées en mode fallback`);
    
    return formattedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequestsFallback] Exception:", error);
    return [];
  }
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Essayer d'abord avec la vue requests_with_missions
    const { data: requestData, error: requestError } = await supabase
      .from('requests_with_missions')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!requestError && requestData) {
      if (isSDR && requestData.created_by !== userId) {
        console.error("❌ [getRequestDetails] SDR accès refusé");
        return null;
      }

      const missionName = requestData.mission_client || requestData.mission_name || "Sans mission";
      
      const request: Request = {
        id: requestData.id,
        title: requestData.title,
        type: requestData.type,
        status: requestData.status as RequestStatus,
        createdBy: requestData.created_by,
        missionId: requestData.mission_id,
        missionName: missionName,
        sdrName: requestData.sdr_name || "Non assigné",
        assignedToName: requestData.assigned_to_name || "Non assigné",
        dueDate: requestData.due_date,
        details: requestData.details || {},
        workflow_status: requestData.workflow_status as WorkflowStatus,
        assigned_to: requestData.assigned_to,
        isLate: new Date(requestData.due_date) < new Date() && requestData.workflow_status !== 'completed' && requestData.workflow_status !== 'canceled',
        createdAt: new Date(requestData.created_at),
        lastUpdated: new Date(requestData.last_updated || requestData.updated_at),
        target_role: requestData.target_role
      };
      
      console.log(`✅ [getRequestDetails] Request formaté depuis vue: ${request.id}, mission="${request.missionName}"`);
      
      return request;
    }
    
    // Fallback vers la table requests de base
    console.log("🔄 [getRequestDetails] Fallback vers table requests");
    
    const { data: baseRequestData, error: baseRequestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (baseRequestError || !baseRequestData) {
      console.error("❌ [getRequestDetails] Erreur ou pas de données:", baseRequestError);
      return null;
    }

    if (isSDR && baseRequestData.created_by !== userId) {
      console.error("❌ [getRequestDetails] SDR accès refusé");
      return null;
    }
    
    const request: Request = {
      id: baseRequestData.id,
      title: baseRequestData.title,
      type: baseRequestData.type,
      status: baseRequestData.status as RequestStatus,
      createdBy: baseRequestData.created_by,
      missionId: baseRequestData.mission_id,
      missionName: "Sans mission", // Valeur par défaut en fallback
      sdrName: "Non assigné",
      assignedToName: "Non assigné",
      dueDate: baseRequestData.due_date,
      details: baseRequestData.details || {},
      workflow_status: baseRequestData.workflow_status as WorkflowStatus,
      assigned_to: baseRequestData.assigned_to,
      isLate: new Date(baseRequestData.due_date) < new Date() && baseRequestData.workflow_status !== 'completed' && baseRequestData.workflow_status !== 'canceled',
      createdAt: new Date(baseRequestData.created_at),
      lastUpdated: new Date(baseRequestData.last_updated || baseRequestData.updated_at),
      target_role: baseRequestData.target_role
    };
    
    console.log(`✅ [getRequestDetails] Request formaté en fallback: ${request.id}`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
