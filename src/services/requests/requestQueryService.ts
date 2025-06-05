
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
    // APPROCHE SIMPLIFIÉE - Utilisons la vue requests_with_missions qui fonctionne
    console.log("🔍 [fetchRequests] Utilisation de la vue requests_with_missions");
    
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
    
    console.log("📋 [fetchRequests] Exécution de la requête sur la vue...");
    
    const { data: requestsData, error: requestsError } = await query;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête vue:", requestsError);
      return [];
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées de la vue`);
    
    if (!requestsData || requestsData.length === 0) {
      console.log("⚠️ [fetchRequests] Aucune donnée retournée");
      return [];
    }

    // Diagnostic approfondi des données de la vue
    console.log("🔍 [fetchRequests] DIAGNOSTIC APPROFONDI des données de la vue:");
    requestsData.slice(0, 3).forEach((request, index) => {
      console.log(`🔍 [fetchRequests] REQUEST ${index + 1}:`, {
        id: request.id,
        mission_id: request.mission_id,
        mission_name: request.mission_name,
        mission_client: request.mission_client,
        mission_name_type: typeof request.mission_name,
        mission_client_type: typeof request.mission_client,
        mission_name_stringified: JSON.stringify(request.mission_name),
        mission_client_stringified: JSON.stringify(request.mission_client)
      });
    });

    // Formatter les données récupérées avec diagnostics détaillés
    const formattedRequests = requestsData.map((request) => {
      console.log(`🔍 [fetchRequests] FORMATAGE request ${request.id}:`);
      console.log(`  - mission_id: "${request.mission_id}"`);
      console.log(`  - mission_client RAW:`, request.mission_client);
      console.log(`  - mission_name RAW:`, request.mission_name);
      
      // Extraire les données de mission avec une logique ultra-claire
      let missionName = "Sans mission";
      
      // Essayer mission_client d'abord
      if (request.mission_client) {
        const clientValue = String(request.mission_client).trim();
        if (clientValue && clientValue !== 'null' && clientValue !== 'undefined' && clientValue !== '') {
          missionName = clientValue;
          console.log(`  ✅ Utilisation mission_client: "${missionName}"`);
        }
      }
      
      // Si pas de client valide, essayer mission_name
      if (missionName === "Sans mission" && request.mission_name) {
        const nameValue = String(request.mission_name).trim();
        if (nameValue && nameValue !== 'null' && nameValue !== 'undefined' && nameValue !== '') {
          missionName = nameValue;
          console.log(`  ✅ Utilisation mission_name: "${missionName}"`);
        }
      }
      
      if (missionName === "Sans mission") {
        console.log(`  ❌ AUCUNE MISSION VALIDE trouvée pour request ${request.id}`);
      }
      
      // Extraire les noms des utilisateurs
      const sdrName = request.sdr_name || "Non assigné";
      const assignedToName = request.assigned_to_name || "Non assigné";
      
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
      
      console.log(`✅ [fetchRequests] Request formatée: ${formattedRequest.id}, mission finale="${formattedRequest.missionName}"`);
      
      return formattedRequest;
    });
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions`);
    console.log(`🔍 [fetchRequests] Exemple de missions récupérées:`, formattedRequests.slice(0, 3).map(r => ({ id: r.id, missionName: r.missionName })));
    
    return formattedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequests] Exception:", error);
    return [];
  }
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Utiliser la vue pour plus de simplicité
    const { data: requestData, error: requestError } = await supabase
      .from('requests_with_missions')
      .select('*')
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

    // Extraire les données de mission
    let missionName = "Sans mission";
    if (requestData.mission_client && String(requestData.mission_client).trim() !== '') {
      missionName = String(requestData.mission_client).trim();
    } else if (requestData.mission_name && String(requestData.mission_name).trim() !== '') {
      missionName = String(requestData.mission_name).trim();
    }
    
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
    
    console.log(`✅ [getRequestDetails] Request formaté: ${request.id}, mission="${request.missionName}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
