
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Format request data from the database - VERSION SIMPLIFIÉE
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 Formatting request ${request.id}`);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // Mission name - SIMPLE ET DIRECT
  let missionName = "Sans mission";
  if (request.missions?.client) {
    missionName = request.missions.client;
  } else if (request.missions?.name) {
    missionName = request.missions.name;
  } else if (request.mission_client) {
    missionName = request.mission_client;
  } else if (request.mission_name) {
    missionName = request.mission_name;
  }
  
  console.log(`[formatRequestFromDb] ✅ Mission: "${missionName}" pour request ${request.id}`);

  // Normaliser les détails
  let details: Record<string, any> = {};
  if (typeof request.details === 'string') {
    try {
      details = JSON.parse(request.details);
    } catch (e) {
      details = {};
    }
  } else if (request.details && typeof request.details === 'object') {
    details = request.details as Record<string, any>;
  }

  const formattedRequest: Request = {
    id: request.id,
    title: request.title,
    type: request.type,
    status: request.status as RequestStatus,
    createdBy: request.created_by,
    missionId: request.mission_id,
    missionName: missionName,
    sdrName: request.created_by_profile?.name || request.sdr_name || "Non assigné",
    assignedToName: request.assigned_to_profile?.name || request.assigned_to_name || "Non assigné",
    dueDate: request.due_date,
    details: details,
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role
  } as Request;

  console.log(`✅ [formatRequestFromDb] Request formaté: ${formattedRequest.id}, mission="${formattedRequest.missionName}"`);
  
  return formattedRequest;
};
