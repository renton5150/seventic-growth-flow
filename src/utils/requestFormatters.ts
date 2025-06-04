
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 START Formatting request ${request.id}`);
  console.log(`[formatRequestFromDb] 🔍 RAW DATA pour request ${request.id}:`, JSON.stringify(request, null, 2));
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // DÉTERMINATION DU NOM FINAL - ESSAYER TOUTES LES SOURCES POSSIBLES
  let missionName = "Sans mission";
  
  // 1. Essayer mission_client en premier (le plus spécifique)
  if (request.mission_client && String(request.mission_client).trim() !== "") {
    missionName = String(request.mission_client).trim();
    console.log(`[formatRequestFromDb] ✅ MISSION CLIENT utilisé: "${missionName}" pour request ${request.id}`);
  }
  // 2. Essayer mission_name 
  else if (request.mission_name && String(request.mission_name).trim() !== "") {
    missionName = String(request.mission_name).trim();
    console.log(`[formatRequestFromDb] ✅ MISSION NAME utilisé: "${missionName}" pour request ${request.id}`);
  }
  // 3. Essayer dans les details
  else if (request.details?.missionName && String(request.details.missionName).trim() !== "") {
    missionName = String(request.details.missionName).trim();
    console.log(`[formatRequestFromDb] ✅ DETAILS MISSION NAME utilisé: "${missionName}" pour request ${request.id}`);
  }
  else {
    console.log(`[formatRequestFromDb] ⚠️ AUCUNE MISSION TROUVÉE pour request ${request.id}`);
  }
  
  console.log(`[formatRequestFromDb] ✅ FINAL mission name pour request ${request.id}: "${missionName}"`);

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

  // GARDER TOUTES LES DONNÉES DE MISSION DANS L'OBJET FINAL
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
    details: {
      ...details,
      // CONSERVER TOUTES LES DONNÉES DE MISSION DANS DETAILS AUSSI
      missionName: missionName,
      mission_name: request.mission_name,
      mission_client: request.mission_client
    },
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role,
    // AJOUTER LES CHAMPS BRUTS POUR DEBUG
    ...(request.mission_name && { mission_name: request.mission_name }),
    ...(request.mission_client && { mission_client: request.mission_client })
  } as Request & { mission_name?: string; mission_client?: string };

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

    console.log(`[formatRequestFromDb] ✅ Email request FINAL pour ${request.id}:`, {
      missionName: emailRequest.missionName,
      mission_name: (emailRequest as any).mission_name,
      mission_client: (emailRequest as any).mission_client
    });
    
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

    console.log(`[formatRequestFromDb] ✅ Database request FINAL pour ${request.id}:`, {
      missionName: databaseRequest.missionName,
      mission_name: (databaseRequest as any).mission_name,
      mission_client: (databaseRequest as any).mission_client
    });
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

    console.log(`[formatRequestFromDb] ✅ LinkedIn request FINAL pour ${request.id}:`, {
      missionName: linkedinRequest.missionName,
      mission_name: (linkedinRequest as any).mission_name,
      mission_client: (linkedinRequest as any).mission_client
    });
    return linkedinRequest;
  }
  
  console.log(`[formatRequestFromDb] ✅ Generic request FINAL pour ${request.id}:`, {
    missionName: baseRequest.missionName,
    mission_name: (baseRequest as any).mission_name,
    mission_client: (baseRequest as any).mission_client
  });
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
