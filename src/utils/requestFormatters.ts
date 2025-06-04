
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 START Formatting request ${request.id}`);
  console.log(`[formatRequestFromDb] 📋 Raw mission data:`, {
    mission_id: request.mission_id,
    mission_client: request.mission_client,
    mission_name: request.mission_name
  });
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // LOGIQUE ULTRA-SIMPLE POUR LE NOM DE MISSION
  let missionName = "Sans mission";
  
  if (request.mission_id) {
    console.log(`[formatRequestFromDb] 🔍 Processing mission ID: ${request.mission_id}`);
    
    // CAS SPÉCIAL: Freshworks uniquement
    const freshworksIds = [
      "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b",
      "57763c8d-fa72-433e-9f9e-5511a6a56062"
    ];
    
    if (freshworksIds.includes(request.mission_id)) {
      missionName = "Freshworks";
      console.log(`[formatRequestFromDb] ✅ FRESHWORKS détecté: ${request.mission_id} => "Freshworks"`);
    } 
    // UTILISER DIRECTEMENT mission_client de la vue - SANS CONDITION COMPLEXE
    else if (request.mission_client) {
      missionName = String(request.mission_client).trim();
      console.log(`[formatRequestFromDb] ✅ MISSION_CLIENT direct: ${request.mission_id} => "${missionName}"`);
    }
    // FALLBACK SIMPLE: mission_name de la vue
    else if (request.mission_name) {
      missionName = String(request.mission_name).trim();
      console.log(`[formatRequestFromDb] ⚠️ MISSION_NAME fallback: ${request.mission_id} => "${missionName}"`);
    }
    else {
      console.warn(`[formatRequestFromDb] ❌ Aucune donnée mission valide pour: ${request.mission_id}`);
      console.warn(`[formatRequestFromDb] ❌ mission_client value:`, request.mission_client);
      console.warn(`[formatRequestFromDb] ❌ mission_name value:`, request.mission_name);
    }
  } else {
    console.log(`[formatRequestFromDb] ⚠️ Aucun mission_id fourni`);
  }
  
  console.log(`[formatRequestFromDb] ✅ FINAL mission name pour request ${request.id}: "${missionName}"`);

  // Normaliser les détails pour éviter les problèmes de type
  let details: Record<string, any> = {};
  if (typeof request.details === 'string') {
    try {
      details = JSON.parse(request.details);
      console.log(`[formatRequestFromDb] Details parsed from string for request ${request.id}`);
    } catch (e) {
      console.error(`[formatRequestFromDb] Error parsing details string for request ${request.id}:`, e);
      details = {};
    }
  } else if (request.details && typeof request.details === 'object') {
    details = request.details as Record<string, any>;
  }

  // Base request with common properties
  const baseRequest: Request = {
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
    details: details,
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role
  };

  // Type-specific processing
  if (request.type === "email") {
    // Ensure template, database, and blacklist are properly extracted and have default values
    const template = details.template || {};
    const database = details.database || {};
    const blacklist = details.blacklist || {};

    // Make sure accounts and emails are properly initialized in blacklist
    if (!blacklist.accounts) blacklist.accounts = { notes: "", fileUrl: "" };
    if (!blacklist.emails) blacklist.emails = { notes: "", fileUrl: "" };

    // Add type-specific properties to the request object
    const emailRequest: Request = {
      ...baseRequest,
      template: template,
      database: database,
      blacklist: blacklist,
      platform: details.platform || "",
      statistics: details.statistics || { sent: 0, opened: 0, clicked: 0, bounced: 0 },
      emailType: details.emailType || "Mass email",
    };

    console.log(`[formatRequestFromDb] Email request processed: ${request.id}`, 
      `template: ${Object.keys(emailRequest.template || {}).length}`,
      `database: ${Object.keys(emailRequest.database || {}).length}`, 
      `blacklist: ${Object.keys(emailRequest.blacklist || {}).length}`);
    
    return emailRequest;
  } 
  else if (request.type === "database") {
    // Extract database-specific properties with defaults
    const targeting = details.targeting || { jobTitles: [], industries: [], companySize: [] };
    const blacklist = details.blacklist || {};
    
    const databaseRequest: Request = {
      ...baseRequest,
      tool: details.tool || "",
      targeting: targeting,
      blacklist: blacklist,
      contactsCreated: details.contactsCreated || 0,
      resultFileUrl: details.resultFileUrl || "",
    };

    console.log(`[formatRequestFromDb] Database request processed: ${request.id}`);
    return databaseRequest;
  } 
  else if (request.type === "linkedin") {
    // Extract linkedin-specific properties with defaults
    const targeting = details.targeting || { jobTitles: [], industries: [], companySize: [] };
    
    const linkedinRequest: Request = {
      ...baseRequest,
      targeting: targeting,
      profilesScraped: details.profilesScraped || 0,
      resultFileUrl: details.resultFileUrl || "",
    };

    console.log(`[formatRequestFromDb] LinkedIn request processed: ${request.id}`);
    return linkedinRequest;
  }
  
  console.log(`[formatRequestFromDb] Generic request processed: ${request.id}`);
  return baseRequest;
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
