
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Formats a request object from database format to application format
 */
export const formatRequestFromDb = (dbRequest: any): Request => {
  // Add logging to see the exact data received from Supabase
  console.log("Raw data for request from Supabase:", dbRequest);
  
  const createdAt = new Date(dbRequest.created_at);
  const dueDate = new Date(dbRequest.due_date);
  const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
  
  // Check if request is late
  const isLate = dueDate < new Date() && 
                 (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
  
  // Get SDR name from relationships or directly from the view
  const sdrName = dbRequest.sdr_name || dbRequest.created_by_profile?.name || "Non assigné";
  
  // Get assigned person name from view or relationships
  const assignedToName = dbRequest.assigned_to_name || dbRequest.assigned_profile?.name || null;
  
  // Get specific details for the request type
  const details = dbRequest.details || {};
  
  // Get mission name and ensure it's never null/undefined
  // Explicit conversion to string to ensure type consistency
  const missionId = dbRequest.mission_id ? String(dbRequest.mission_id) : "";
  let missionName = dbRequest.mission_name || "Mission sans nom";
  
  console.log("Final mission name for request", dbRequest.id, ":", missionName);
  console.log("Final mission ID for request", dbRequest.id, ":", missionId);
  console.log("Type of mission ID:", typeof missionId);
  
  // Build the base request with all required properties
  const baseRequest: Request = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: missionId,
    missionName: missionName,
    createdBy: dbRequest.created_by,
    sdrName,
    createdAt,
    dueDate,
    status: dbRequest.status as RequestStatus,
    workflow_status: dbRequest.workflow_status as WorkflowStatus || 'pending_assignment',
    target_role: dbRequest.target_role || 'growth',
    assigned_to: dbRequest.assigned_to || null,
    assignedToName,
    lastUpdated,
    isLate,
    details
  };

  // Type-specific fields are now added to the details property
  return baseRequest;
}
