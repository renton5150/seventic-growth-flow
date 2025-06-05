
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
    // DIAGNOSTIC APPROFONDI - D'abord tester la vue requests_with_missions
    console.log("🔍 [fetchRequests] TEST VUE - Récupération d'un échantillon de requests_with_missions");
    const { data: sampleData, error: sampleError } = await supabase
      .from('requests_with_missions')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error("❌ [fetchRequests] ERREUR échantillon vue:", sampleError);
    } else {
      console.log("📋 [fetchRequests] ÉCHANTILLON VUE:", sampleData);
      sampleData?.forEach((row, index) => {
        console.log(`🔍 [fetchRequests] ÉCHANTILLON ${index + 1}:`, {
          id: row.id,
          mission_id: row.mission_id,
          mission_name: row.mission_name,
          mission_client: row.mission_client,
          mission_name_type: typeof row.mission_name,
          mission_client_type: typeof row.mission_client,
          mission_name_value: JSON.stringify(row.mission_name),
          mission_client_value: JSON.stringify(row.mission_client)
        });
      });
    }

    // Utiliser une approche alternative : récupérer directement depuis requests avec jointure manuelle
    console.log("🔄 [fetchRequests] APPROCHE ALTERNATIVE - Récupération depuis requests avec jointure manuelle");
    
    let query = supabase
      .from('requests')
      .select(`
        *,
        missions!requests_mission_id_fkey (
          id,
          name,
          client
        ),
        profiles!requests_created_by_fkey (
          name
        ),
        assigned_profiles:profiles!requests_assigned_to_fkey (
          name
        )
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
    
    console.log("📋 [fetchRequests] Exécution de la requête avec jointure manuelle...");
    
    const { data: requestsData, error: requestsError } = await query;
    
    if (requestsError) {
      console.error("❌ [fetchRequests] Erreur requête avec jointure:", requestsError);
      return [];
    }
    
    console.log(`📋 [fetchRequests] ${requestsData?.length || 0} requests récupérées avec jointure manuelle`);
    
    if (!requestsData || requestsData.length === 0) {
      console.log("⚠️ [fetchRequests] Aucune donnée retournée");
      return [];
    }

    // Formatter les données récupérées avec diagnostics détaillés
    const formattedRequests = requestsData.map((request) => {
      console.log(`🔍 [fetchRequests] JOINTURE MANUELLE - DIAGNOSTIC pour request ${request.id}:`);
      console.log(`  - mission_id: "${request.mission_id}"`);
      console.log(`  - missions object:`, request.missions);
      console.log(`  - profiles object:`, request.profiles);
      console.log(`  - assigned_profiles object:`, request.assigned_profiles);
      
      // Extraire les données de mission
      let missionName = "Sans mission";
      const missionData = request.missions;
      
      if (missionData) {
        console.log(`  - Mission data found:`, missionData);
        if (missionData.client && String(missionData.client).trim() !== '') {
          missionName = String(missionData.client).trim();
          console.log(`  ✅ Utilisation mission.client: "${missionName}"`);
        } else if (missionData.name && String(missionData.name).trim() !== '') {
          missionName = String(missionData.name).trim();
          console.log(`  ✅ Utilisation mission.name: "${missionName}"`);
        } else {
          console.log(`  ⚠️ Mission trouvée mais pas de nom valide`);
        }
      } else {
        console.log(`  ⚠️ Aucune mission associée`);
      }
      
      // Extraire les noms des utilisateurs
      const sdrName = request.profiles?.name || "Non assigné";
      const assignedToName = request.assigned_profiles?.name || "Non assigné";
      
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
      
      console.log(`✅ [fetchRequests] Request formatée avec jointure: ${formattedRequest.id}, mission finale="${formattedRequest.missionName}"`);
      
      return formattedRequest;
    });
    
    console.log(`✅ [fetchRequests] ${formattedRequests.length} requests formatées avec missions via jointure manuelle`);
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
    
    // Utiliser l'approche de jointure manuelle pour plus de fiabilité
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        missions!requests_mission_id_fkey (
          id,
          name,
          client
        ),
        profiles!requests_created_by_fkey (
          name
        ),
        assigned_profiles:profiles!requests_assigned_to_fkey (
          name
        )
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

    // Extraire les données de mission
    let missionName = "Sans mission";
    const missionData = requestData.missions;
    
    if (missionData) {
      if (missionData.client && String(missionData.client).trim() !== '') {
        missionName = String(missionData.client).trim();
      } else if (missionData.name && String(missionData.name).trim() !== '') {
        missionName = String(missionData.name).trim();
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
      sdrName: requestData.profiles?.name || "Non assigné",
      assignedToName: requestData.assigned_profiles?.name || "Non assigné",
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
