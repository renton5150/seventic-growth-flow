
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
  
  // CORRECTION : Utiliser une syntaxe de jointure simple
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
  
  console.log("📋 [fetchRequests] Exécution de la requête Supabase...");
  
  const { data, error } = await query;
  
  if (error) {
    console.error("❌ [fetchRequests] Erreur Supabase:", error);
    // Essayer une requête de fallback sans jointures forcées
    console.log("🔄 [fetchRequests] Tentative avec jointure simple...");
    
    const fallbackQuery = supabase
      .from('requests')
      .select(`
        *,
        missions(id, name, client),
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `);
      
    // Réappliquer les filtres pour la requête de fallback
    if (filters?.assignedToIsNull) fallbackQuery.is('assigned_to', null);
    if (filters?.workflowStatus) fallbackQuery.eq('workflow_status', filters.workflowStatus);
    if (filters?.workflowStatusNot) fallbackQuery.neq('workflow_status', filters.workflowStatusNot);
    if (filters?.assignedTo) fallbackQuery.eq('assigned_to', filters.assignedTo);
    if (filters?.createdBy) fallbackQuery.eq('created_by', filters.createdBy);
    if (filters?.assignedToIsNotNull) fallbackQuery.not('assigned_to', 'is', null);
    
    fallbackQuery.order('due_date', { ascending: true });
    
    const fallbackResult = await fallbackQuery;
    
    if (fallbackResult.error) {
      console.error("❌ [fetchRequests] Erreur fallback:", fallbackResult.error);
      return [];
    }
    
    console.log(`📋 [fetchRequests] Fallback réussi: ${fallbackResult.data?.length || 0} requests`);
    data = fallbackResult.data;
  } else {
    console.log(`📋 [fetchRequests] ${data?.length || 0} requests récupérées`);
  }
  
  if (!data || data.length === 0) {
    console.log("⚠️ [fetchRequests] Aucune donnée retournée");
    return [];
  }
  
  console.log("🔍 [fetchRequests] Première request brute:", data[0]);
  
  // Transformation avec logs détaillés pour chaque request
  const requests = data.map((row: any) => {
    console.log(`🔍 [fetchRequests] Processing request ${row.id}:`, {
      raw_row: row,
      missions_object: row.missions,
      mission_name: row.missions?.name,
      mission_client: row.missions?.client,
      title: row.title
    });
    
    // DIAGNOSTIC : Tester différentes façons d'accéder au nom de mission
    let missionName = "Sans mission";
    if (row.missions) {
      if (row.missions.client) {
        missionName = row.missions.client;
        console.log(`✅ [fetchRequests] Mission trouvée via client: "${missionName}"`);
      } else if (row.missions.name) {
        missionName = row.missions.name;
        console.log(`✅ [fetchRequests] Mission trouvée via name: "${missionName}"`);
      } else {
        console.log(`⚠️ [fetchRequests] Mission object exists but no client/name:`, row.missions);
      }
    } else {
      console.log(`❌ [fetchRequests] Pas d'objet missions pour request ${row.id}`);
    }
    
    const formattedRequest: Request = {
      id: row.id,
      title: row.title,
      type: row.type,
      status: row.status as RequestStatus,
      createdBy: row.created_by,
      missionId: row.mission_id,
      missionName: missionName,
      sdrName: row.created_by_profile?.name || "Non assigné",
      assignedToName: row.assigned_to_profile?.name || "Non assigné",
      dueDate: row.due_date,
      details: row.details || {},
      workflow_status: row.workflow_status as WorkflowStatus,
      assigned_to: row.assigned_to,
      isLate: new Date(row.due_date) < new Date() && row.workflow_status !== 'completed' && row.workflow_status !== 'canceled',
      createdAt: new Date(row.created_at),
      lastUpdated: new Date(row.last_updated || row.updated_at),
      target_role: row.target_role
    };
    
    console.log(`✅ [fetchRequests] Request formatée: ${formattedRequest.id}, mission="${formattedRequest.missionName}"`);
    
    return formattedRequest;
  });
  
  console.log(`✅ [fetchRequests] ${requests.length} requests formatées avec missions`);
  
  return requests;
};

export const getRequestDetails = async (requestId: string, userId?: string, isSDR: boolean = false): Promise<Request | null> => {
  try {
    console.log("🔍 [getRequestDetails] Récupération pour:", requestId);
    
    // Utiliser la même approche simple pour les détails
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        missions(id, name, client),
        created_by_profile:profiles!requests_created_by_fkey(name),
        assigned_to_profile:profiles!requests_assigned_to_fkey(name)
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (data && isSDR && data.created_by !== userId) {
      console.error("❌ [getRequestDetails] SDR accès refusé");
      return null;
    }

    if (error) {
      console.error("❌ [getRequestDetails] Erreur:", error);
      return null;
    }

    if (!data) {
      console.log("⚠️ [getRequestDetails] Aucune donnée pour:", requestId);
      return null;
    }

    console.log("🔍 [getRequestDetails] Données récupérées:", {
      missions_object: data.missions,
      mission_name: data.missions?.name,
      mission_client: data.missions?.client,
      title: data.title
    });

    const missionName = data.missions?.client || data.missions?.name || "Sans mission";
    
    const request: Request = {
      id: data.id,
      title: data.title,
      type: data.type,
      status: data.status as RequestStatus,
      createdBy: data.created_by,
      missionId: data.mission_id,
      missionName: missionName,
      sdrName: data.created_by_profile?.name || "Non assigné",
      assignedToName: data.assigned_to_profile?.name || "Non assigné",
      dueDate: data.due_date,
      details: data.details || {},
      workflow_status: data.workflow_status as WorkflowStatus,
      assigned_to: data.assigned_to,
      isLate: new Date(data.due_date) < new Date() && data.workflow_status !== 'completed' && data.workflow_status !== 'canceled',
      createdAt: new Date(data.created_at),
      lastUpdated: new Date(data.last_updated || data.updated_at),
      target_role: data.target_role
    };
    
    console.log(`✅ [getRequestDetails] Request formaté: ${request.id}, mission="${request.missionName}"`);
    
    return request;
  } catch (err) {
    console.error("❌ [getRequestDetails] Exception:", err);
    return null;
  }
};
