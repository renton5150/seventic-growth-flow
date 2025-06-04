
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 START Formatting request ${request.id}`);
  console.log(`[formatRequestFromDb] 🔍 RAW DATA pour request ${request.id}:`, request);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // CORRECTION MAJEURE : Utilisation directe des champs de la vue requests_with_missions
  let missionName = "Sans mission";
  
  // Utiliser directement mission_client (priorité 1) ou mission_name (priorité 2)
  if (request.mission_client && request.mission_client.trim() !== "") {
    missionName = request.mission_client.trim();
    console.log(`[formatRequestFromDb] ✅ Utilisation de mission_client: "${missionName}" pour request ${request.id}`);
  } else if (request.mission_name && request.mission_name.trim() !== "") {
    missionName = request.mission_name.trim();
    console.log(`[formatRequestFromDb] ✅ Utilisation de mission_name: "${missionName}" pour request ${request.id}`);
  } else {
    console.log(`[formatRequestFromDb] ⚠️ Aucune mission trouvée - mission_client: "${request.mission_client}", mission_name: "${request.mission_name}" pour request ${request.id}`);
  }
  
  console.log(`[formatRequestFromDb] ✅ MISSION NAME FINAL pour request ${request.id}: "${missionName}"`);

  // Récupération des noms SDR et assigné
  const sdrName = request.sdr_name || null;
  const assignedToName = request.assigned_to_name || null;

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

  const baseRequest: Request = {
    id: request.id,
    title: request.title,
    type: request.type,
    status: request.status as RequestStatus,
    createdBy: request.created_by,
    missionId: request.mission_id,
    missionName: missionName, // Utilisation du nom corrigé
    sdrName: sdrName,
    assignedToName: assignedToName,
    dueDate: request.due_date,
    details: {
      ...details,
      missionName: missionName // S'assurer que les détails contiennent aussi le nom correct
    },
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role
  } as Request;

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

    console.log(`[formatRequestFromDb] ✅ Email request FINAL pour ${request.id}: missionName="${emailRequest.missionName}"`);
    
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

    console.log(`[formatRequestFromDb] ✅ Database request FINAL pour ${request.id}: missionName="${databaseRequest.missionName}"`);
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

    console.log(`[formatRequestFromDb] ✅ LinkedIn request FINAL pour ${request.id}: missionName="${linkedinRequest.missionName}"`);
    return linkedinRequest;
  }
  
  console.log(`[formatRequestFromDb] ✅ Generic request FINAL pour ${request.id}: missionName="${baseRequest.missionName}"`);
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
    mission_client: "Test Client", 
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
