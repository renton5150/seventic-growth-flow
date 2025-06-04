
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 START Formatting request ${request.id}`);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // RÉCUPÉRATION DU NOM DE MISSION DEPUIS LE JOIN EXPLICITE
  console.log(`[formatRequestFromDb] 🔍 DONNÉES MISSION DEPUIS JOIN pour request ${request.id}:`, {
    missions_object: request.missions,
    sdr_object: request.sdr,
    assigned_user_object: request.assigned_user
  });
  
  // DÉTERMINATION DU NOM FINAL - utiliser directement les données du JOIN
  let missionName = "Sans mission";
  
  if (request.missions) {
    // Priorité au client, sinon au nom
    if (request.missions.client && String(request.missions.client).trim() !== "") {
      missionName = String(request.missions.client).trim();
      console.log(`[formatRequestFromDb] ✅ MISSION CLIENT utilisé: "${missionName}" pour request ${request.id}`);
    } else if (request.missions.name && String(request.missions.name).trim() !== "") {
      missionName = String(request.missions.name).trim();
      console.log(`[formatRequestFromDb] ✅ MISSION NAME utilisé: "${missionName}" pour request ${request.id}`);
    } else {
      console.log(`[formatRequestFromDb] ⚠️ MISSION TROUVÉE MAIS VIDE pour request ${request.id}`);
    }
  } else {
    console.log(`[formatRequestFromDb] ⚠️ AUCUNE MISSION TROUVÉE pour request ${request.id}`);
  }
  
  console.log(`[formatRequestFromDb] ✅ FINAL mission name pour request ${request.id}: "${missionName}"`);

  // Récupération des noms SDR et assigné
  const sdrName = request.sdr?.name || null;
  const assignedToName = request.assigned_user?.name || null;

  console.log(`[formatRequestFromDb] 👥 NOMS pour request ${request.id}: sdr="${sdrName}", assigned="${assignedToName}"`);

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
    sdrName: sdrName,
    assignedToName: assignedToName,
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
    missions: { id: "456", name: "Test Mission", client: "Test Client" },
    sdr: { id: "user1", name: "John Doe" },
    assigned_user: { id: "user2", name: "Jane Smith" },
    details: { platform: "Mailchimp" },
    workflow_status: "in_progress",
    assigned_to: "user123",
    target_role: "marketing",
  };

  formatRequestFromDb(rawRequestData).then(formattedRequest => {
    console.log("Formatted Request:", formattedRequest);
  });
};
