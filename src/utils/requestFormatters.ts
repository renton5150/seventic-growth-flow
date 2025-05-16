
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { getMissionName, KNOWN_MISSIONS, forceRefreshFreshworks } from "@/services/missionNameService";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  console.log(`[formatRequestFromDb] START Formatting request ${request.id}, mission_id: ${request.mission_id}`);
  console.log(`Raw mission data: mission_name: ${request.mission_name || 'MISSING'}, mission_client: ${request.mission_client || 'MISSING'}`);

  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // Force refresh Freshworks in cache
  if (request.mission_id === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b") {
    forceRefreshFreshworks();
    console.log("[formatRequestFromDb] Freshworks mission detected, refreshing cache");
  }
  
  // MISSION NAME PROCESSING
  let missionName = "Sans mission";
  
  // Pour les missions connues, utiliser directement les noms constants
  if (request.mission_id && KNOWN_MISSIONS[request.mission_id]) {
    missionName = KNOWN_MISSIONS[request.mission_id];
    console.log(`[formatRequestFromDb] Using known mission name: "${missionName}" for ${request.mission_id}`);
  } else {
    // Sinon utiliser le service centralisé
    missionName = await getMissionName(request.mission_id, {
      fallbackClient: request.mission_client, 
      fallbackName: request.mission_name,
      forceRefresh: false
    });
  }
  
  console.log(`[formatRequestFromDb] FINAL mission name for request ${request.id}: "${missionName}"`);

  return {
    id: request.id,
    title: request.title,
    type: request.type,
    status: request.status as RequestStatus,
    createdBy: request.created_by,
    missionId: request.mission_id,
    missionName: missionName, // Important : utiliser le nom standardisé
    sdrName: request.sdr_name,
    assignedToName: request.assigned_to_name,
    dueDate: request.due_date,
    details: request.details || {},
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role
  };
};

// Example usage of the formatting function
export const example = () => {
  const rawRequestData = {
    id: "123",
    title: "Create Email Campaign",
    type: "email",
    status: "pending",
    created_at: new Date(),
    last_updated: new Date(),
    due_date: new Date(),
    mission_id: "456",
    mission_name: "Test Mission",
    sdr_name: "John Doe",
    assigned_to_name: "Jane Smith",
    details: { platform: "Mailchimp" },
    workflow_status: "in_progress",
    assigned_to: "user123",
    target_role: "marketing",
  };

  formatRequestFromDb(rawRequestData).then(formattedRequest => {
    console.log("Formatted Request:", formattedRequest);
  });
};
