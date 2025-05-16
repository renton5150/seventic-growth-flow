
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Utility function to format dates as needed
const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(); // Adjust format as needed
};

// Format request data from the database
export const formatRequestFromDb = (request: any): Request => {
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  console.log(`[formatRequestFromDb] Formatting request ${request.id}, mission_id: ${request.mission_id}, mission_name: ${request.mission_name || 'MISSING'}, mission_client: ${request.mission_client || 'MISSING'}`);

  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // Prioritize client name if it differs from mission name
  let missionName = "Sans mission";
  
  if (request.mission_client && request.mission_name !== request.mission_client) {
    missionName = request.mission_client;
  } else if (request.mission_name) {
    missionName = request.mission_name;
  }
  
  console.log(`[formatRequestFromDb] Final mission name for request ${request.id}: "${missionName}"`);

  return {
    id: request.id,
    title: request.title,
    type: request.type,
    status: request.status as RequestStatus,
    createdBy: request.created_by,
    missionId: request.mission_id,
    missionName: missionName,
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

  const formattedRequest = formatRequestFromDb(rawRequestData);
  console.log("Formatted Request:", formattedRequest);
};
