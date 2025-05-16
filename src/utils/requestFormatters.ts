
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";

// Cache for mission names to avoid repeated database queries
const missionNameCache: Record<string, string> = {};

// Utility function to format dates as needed
const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(); // Adjust format as needed
};

// Get mission name directly from the missions table if needed
const getMissionNameFromDb = async (missionId: string): Promise<string | null> => {
  if (!missionId) return null;
  
  // Check cache first
  if (missionNameCache[missionId]) {
    console.log(`[getMissionNameFromDb] Using cached mission name for ${missionId}: "${missionNameCache[missionId]}"`);
    return missionNameCache[missionId];
  }
  
  try {
    console.log(`[getMissionNameFromDb] Fetching mission name for ID: ${missionId}`);
    
    const { data, error } = await supabase
      .from('missions')
      .select('id, name, client')
      .eq('id', missionId)
      .single();
    
    if (error || !data) {
      console.error(`[getMissionNameFromDb] Error or no data for mission ${missionId}:`, error);
      return null;
    }
    
    // Apply the same naming priority logic as everywhere else
    let missionName = "Sans mission";
    
    if (data.client && data.client.trim() !== "" && 
        data.client !== "null" && data.client !== "undefined") {
      missionName = data.client;
      console.log(`[getMissionNameFromDb] Using client name: "${missionName}"`);
    }
    else if (data.name && data.name.trim() !== "" && 
             data.name !== "null" && data.name !== "undefined") {
      missionName = data.name;
      console.log(`[getMissionNameFromDb] Using mission name: "${missionName}"`);
    }
    else {
      missionName = `Mission ${missionId.substring(0, 8)}`;
      console.log(`[getMissionNameFromDb] Using ID-based name: "${missionName}"`);
    }
    
    // Cache the result
    missionNameCache[missionId] = missionName;
    
    return missionName;
  } catch (err) {
    console.error(`[getMissionNameFromDb] Exception fetching mission ${missionId}:`, err);
    return null;
  }
};

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
  
  // MISSION NAME PROCESSING - CRITICAL FIX
  // Consistently apply the same logic for mission name selection across the entire app
  let missionName = "Sans mission";
  
  // Step 1: Check if we have mission_client and mission_name from the request (from view)
  if (request.mission_client && request.mission_client.trim() !== "" && 
      request.mission_client !== "null" && request.mission_client !== "undefined") {
    missionName = request.mission_client;
    console.log(`[formatRequestFromDb] PRIORITY #1: Using client name: "${missionName}"`);
  }
  else if (request.mission_name && request.mission_name.trim() !== "" && 
           request.mission_name !== "null" && request.mission_name !== "undefined") {
    missionName = request.mission_name;
    console.log(`[formatRequestFromDb] PRIORITY #2: Using mission name: "${missionName}"`);
  }
  // Step 2: If we have a mission_id but no name info from the view, try to fetch directly
  else if (request.mission_id) {
    const dbMissionName = await getMissionNameFromDb(request.mission_id);
    if (dbMissionName) {
      missionName = dbMissionName;
      console.log(`[formatRequestFromDb] PRIORITY #3: Using db-fetched name: "${missionName}"`);
    } else {
      missionName = `Mission ${String(request.mission_id).substring(0, 8)}`;
      console.log(`[formatRequestFromDb] PRIORITY #4: Using ID short name: "${missionName}"`);
    }
  }
  else {
    console.log(`[formatRequestFromDb] FALLBACK: No mission info available - using default: "${missionName}"`);
  }
  
  console.log(`[formatRequestFromDb] FINAL mission name for request ${request.id}: "${missionName}"`);

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

  formatRequestFromDb(rawRequestData).then(formattedRequest => {
    console.log("Formatted Request:", formattedRequest);
  });
};
