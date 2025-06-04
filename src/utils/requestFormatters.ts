
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { getMissionName } from "@/services/missionNameService";

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
  
  // RÉCUPÉRATION DU NOM DE MISSION via le service centralisé
  console.log(`[formatRequestFromDb] 🔍 MISSION ID pour request ${request.id}: ${request.mission_id}`);
  
  let missionName = "Sans mission";
  
  if (request.mission_id) {
    try {
      // Utiliser le service centralisé pour obtenir le nom de mission
      missionName = await getMissionName(request.mission_id, {
        fallbackClient: request.missions?.client,
        fallbackName: request.missions?.name,
        forceRefresh: false
      });
      console.log(`[formatRequestFromDb] ✅ Mission name récupéré via service: "${missionName}" pour request ${request.id}`);
    } catch (err) {
      console.error(`[formatRequestFromDb] ❌ Erreur lors de la récupération du nom de mission pour ${request.id}:`, err);
      
      // Fallback vers les données JOIN si disponibles
      if (request.missions) {
        if (request.missions.client && request.missions.client.trim() !== "") {
          missionName = request.missions.client.trim();
          console.log(`[formatRequestFromDb] 🔄 Fallback vers missions.client: "${missionName}"`);
        } else if (request.missions.name && request.missions.name.trim() !== "") {
          missionName = request.missions.name.trim();
          console.log(`[formatRequestFromDb] 🔄 Fallback vers missions.name: "${missionName}"`);
        }
      }
    }
  } else {
    console.log(`[formatRequestFromDb] ℹ️ Pas de mission_id pour request ${request.id}`);
  }
  
  console.log(`[formatRequestFromDb] ✅ MISSION NAME FINAL pour request ${request.id}: "${missionName}"`);

  // Récupération des noms SDR et assigné depuis les JOINs
  const sdrName = request.sdr_profile?.name || null;
  const assignedToName = request.assigned_profile?.name || null;

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
    missionName: missionName,
    sdrName: sdrName,
    assignedToName: assignedToName,
    dueDate: request.due_date,
    details: {
      ...details,
      missionName: missionName
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
