
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
  
  // CORRECTION : Utiliser la vue requests_with_missions qui a déjà les jointures
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
  
  const { data, error } = await query;
  
  if (error) {
    console.error("❌ [fetchRequests] Erreur:", error);
    return [];
  }
  
  console.log(`📋 [fetchRequests] ${data?.length || 0} requests récupérées`);
  console.log("🔍 [fetchRequests] Première request brute (avec missions):", data?.[0]);
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Transformation directe et simple - utiliser les champs de la vue
  const requests = data.map((row: any) => {
    console.log(`🔍 [fetchRequests] Processing request ${row.id}:`, {
      mission_name: row.mission_name,
      mission_client: row.mission_client,
      title: row.title
    });
    
    // La vue requests_with_missions a déjà mission_name et mission_client
    const missionName = row.mission_client || row.mission_name || "Sans mission";
    
    const formattedRequest: Request = {
      id: row.id,
      title: row.title,
      type: row.type,
      status: row.status as RequestStatus,
      createdBy: row.created_by,
      missionId: row.mission_id,
      missionName: missionName,
      sdrName: row.sdr_name || "Non assigné",
      assignedToName: row.assigned_to_name || "Non assigné",
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
    
    // Utiliser aussi la vue pour les détails
    const { data, error } = await supabase
      .from('requests_with_missions')
      .select('*')
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
      mission_name: data.mission_name,
      mission_client: data.mission_client,
      title: data.title
    });

    const missionName = data.mission_client || data.mission_name || "Sans mission";
    
    const request: Request = {
      id: data.id,
      title: data.title,
      type: data.type,
      status: data.status as RequestStatus,
      createdBy: data.created_by,
      missionId: data.mission_id,
      missionName: missionName,
      sdrName: data.sdr_name || "Non assigné",
      assignedToName: data.assigned_to_name || "Non assigné",
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
