
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
    console.log("🔍 [fetchRequests] Récupération directe des requests avec jointure manuelle");
    
    // 1. D'abord récupérer toutes les requests avec filtres
    let requestQuery = supabase
      .from('requests')
      .select(`
        *,
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `);
    
    // Appliquer les filtres sur les requests
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

    // 2. Récupérer toutes les missions d'un coup
    const missionIds = [...new Set(requestsData.map(r => r.mission_id).filter(Boolean))];
    console.log(`🔍 [fetchRequests] Mission IDs à récupérer:`, missionIds);
    
    let missionsMap = new Map();
    
    if (missionIds.length > 0) {
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('id, name, client')
        .in('id', missionIds);
      
      if (missionsError) {
        console.error("❌ [fetchRequests] Erreur récupération missions:", missionsError);
      } else {
        console.log(`✅ [fetchRequests] ${missionsData?.length || 0} missions récupérées:`, missionsData);
        missionsData?.forEach(mission => {
          console.log(`🎯 [fetchRequests] Mission ${mission.id}: client="${mission.client}", name="${mission.name}"`);
          missionsMap.set(mission.id, mission);
        });
      }
    }

    // 3. Formatter les données avec les missions
    const formattedRequests = requestsData.map((request) => {
      console.log(`🔍 [fetchRequests] FORMATAGE request ${request.id} avec mission_id: ${request.mission_id}`);
      
      // Récupérer la mission depuis notre Map
      const mission = missionsMap.get(request.mission_id);
      let missionName = "Sans mission";
      
      if (mission) {
        // PRIORITÉ: client d'abord, puis name
        if (mission.client && String(mission.client).trim() !== '') {
          missionName = String(mission.client).trim();
          console.log(`  ✅ Mission trouvée - CLIENT: "${missionName}"`);
        } else if (mission.name && String(mission.name).trim() !== '') {
          missionName = String(mission.name).trim();
          console.log(`  ✅ Mission trouvée - NAME: "${missionName}"`);
        } else {
          console.log(`  ❌ Mission ${mission.id} trouvée mais sans nom valide`);
        }
      } else {
        console.log(`  ❌ AUCUNE MISSION trouvée pour ID: ${request.mission_id}`);
      }
      
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
      
      console.log(`✅ [fetchRequests] Request formatée: ${formattedRequest.id}, mission finale="${formattedRequest.missionName}"`);
      
      return formattedRequest;
    });
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions`);
    console.log(`🔍 [fetchRequests] Exemple de missions finales:`, formattedRequests.slice(0, 3).map(r => ({ id: r.id, missionName: r.missionName })));
    
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

    // Récupérer la mission séparément si elle existe
    let missionName = "Sans mission";
    if (requestData.mission_id) {
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .select('id, name, client')
        .eq('id', requestData.mission_id)
        .single();
      
      if (!missionError && missionData) {
        if (missionData.client && String(missionData.client).trim() !== '') {
          missionName = String(missionData.client).trim();
        } else if (missionData.name && String(missionData.name).trim() !== '') {
          missionName = String(missionData.name).trim();
        }
        console.log(`✅ [getRequestDetails] Mission trouvée: "${missionName}"`);
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
    
    console.log(`✅ [getRequestDetails] Request formaté: ${request.id}, mission="${request.missionName}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
