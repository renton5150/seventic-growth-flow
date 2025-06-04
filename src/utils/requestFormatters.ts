
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Fonction helper pour extraire la valeur d'un objet avec _type et value
const extractValue = (obj: any): string | null => {
  if (!obj) return null;
  
  // Si c'est déjà une chaîne simple
  if (typeof obj === 'string') {
    return obj.trim() !== "" && obj !== "null" && obj !== "undefined" ? obj.trim() : null;
  }
  
  // Si c'est un objet avec _type et value
  if (obj && typeof obj === 'object' && obj.value !== undefined) {
    const value = obj.value;
    if (typeof value === 'string' && value.trim() !== "" && value !== "null" && value !== "undefined") {
      return value.trim();
    }
  }
  
  return null;
};

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 START Formatting request ${request.id}`);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // EXTRACTION DES VRAIES VALEURS MISSION
  console.log(`[formatRequestFromDb] 🔍 DONNÉES MISSION RAW pour request ${request.id}:`, {
    mission_id: request.mission_id,
    mission_client_raw: request.mission_client,
    mission_name_raw: request.mission_name,
    missions_object: request.missions
  });
  
  // Extraire les valeurs avec la fonction helper
  const missionClientValue = extractValue(request.mission_client);
  const missionNameValue = extractValue(request.mission_name);
  const missionsClientValue = request.missions?.client ? extractValue(request.missions.client) : null;
  const missionsNameValue = request.missions?.name ? extractValue(request.missions.name) : null;
  
  console.log(`[formatRequestFromDb] 🔍 VALEURS EXTRAITES pour request ${request.id}:`, {
    missionClientValue,
    missionNameValue,
    missionsClientValue,
    missionsNameValue
  });
  
  // DÉTERMINATION DU NOM FINAL avec priorité
  let missionName = "Sans mission";
  
  if (missionClientValue) {
    missionName = missionClientValue;
    console.log(`[formatRequestFromDb] ✅ MISSION CLIENT utilisé: "${missionName}" pour request ${request.id}`);
  } else if (missionsClientValue) {
    missionName = missionsClientValue;
    console.log(`[formatRequestFromDb] ✅ MISSIONS.CLIENT utilisé: "${missionName}" pour request ${request.id}`);
  } else if (missionNameValue) {
    missionName = missionNameValue;
    console.log(`[formatRequestFromDb] ✅ MISSION NAME utilisé: "${missionName}" pour request ${request.id}`);
  } else if (missionsNameValue) {
    missionName = missionsNameValue;
    console.log(`[formatRequestFromDb] ✅ MISSIONS.NAME utilisé: "${missionName}" pour request ${request.id}`);
  } else {
    console.log(`[formatRequestFromDb] ⚠️ AUCUNE MISSION VALIDE trouvée pour request ${request.id}, garde "Sans mission"`);
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
    missionName: missionName,  // UTILISATION DU VRAI NOM DÉTERMINÉ
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

    if (!blacklist.accounts) blacklist.accounts = { notes: "", fileUrl: "" };
    if (!blacklist.emails) blacklist.emails = { notes: "", fileUrl: "" };

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
  return baseRequest as Request;
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
