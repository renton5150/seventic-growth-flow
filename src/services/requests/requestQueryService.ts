
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
    // Utiliser d'abord une requête simple sans jointures pour tester
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
    
    console.log("📋 [fetchRequests] Exécution de la requête de base...");
    
    const { data: requestsData, error: requestsError } = await baseQuery;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête de base:", requestsError);
      return [];
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests de base récupérées`);
    
    if (!requestsData || requestsData.length === 0) {
      console.log("⚠️ [fetchRequests] Aucune donnée retournée de la requête de base");
      return [];
    }
    
    // Maintenant enrichir avec les données des missions et profils
    const enrichedRequests = await Promise.all(
      requestsData.map(async (request) => {
        console.log(`🔍 [fetchRequests] Enrichissement de la request ${request.id}`);
        
        // Récupérer la mission
        let missionName = "Sans mission";
        if (request.mission_id) {
          const { data: missionData } = await supabase
            .from('missions')
            .select('name, client')
            .eq('id', request.mission_id)
            .single();
          
          if (missionData) {
            missionName = missionData.client || missionData.name || "Sans mission";
            console.log(`✅ [fetchRequests] Mission trouvée pour ${request.id}: "${missionName}"`);
          }
        }
        
        // Récupérer le nom du créateur
        let sdrName = "Non assigné";
        if (request.created_by) {
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', request.created_by)
            .single();
          
          if (creatorData) {
            sdrName = creatorData.name || "Non assigné";
          }
        }
        
        // Récupérer le nom de la personne assignée
        let assignedToName = "Non assigné";
        if (request.assigned_to) {
          const { data: assignedData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', request.assigned_to)
            .single();
          
          if (assignedData) {
            assignedToName = assignedData.name || "Non assigné";
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
        
        console.log(`✅ [fetchRequests] Request enrichie: ${formattedRequest.id}, mission="${formattedRequest.missionName}"`);
        
        return formattedRequest;
      })
    );
    
    console.log(`✅ [fetchRequests] ${enrichedRequests.length} requests enrichies avec missions`);
    
    return enrichedRequests;
    
  } catch (error) {
    console.error("❌ [fetchRequests] Exception:", error);
    return [];
  }
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Récupérer d'abord la request de base
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
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

    // Enrichir avec les données de mission
    let missionName = "Sans mission";
    if (requestData.mission_id) {
      const { data: missionData } = await supabase
        .from('missions')
        .select('name, client')
        .eq('id', requestData.mission_id)
        .single();
      
      if (missionData) {
        missionName = missionData.client || missionData.name || "Sans mission";
      }
    }
    
    // Enrichir avec les noms des profils
    let sdrName = "Non assigné";
    if (requestData.created_by) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', requestData.created_by)
        .single();
      
      if (creatorData) {
        sdrName = creatorData.name || "Non assigné";
      }
    }
    
    let assignedToName = "Non assigné";
    if (requestData.assigned_to) {
      const { data: assignedData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', requestData.assigned_to)
        .single();
      
      if (assignedData) {
        assignedToName = assignedData.name || "Non assigné";
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
      sdrName: sdrName,
      assignedToName: assignedToName,
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
