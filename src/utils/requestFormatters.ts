
import { Request, RequestStatus, WorkflowStatus, EmailCampaignRequest } from "@/types/types";

// Format request data from the database - VERSION AMÉLIORÉE
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] 🚀 Formatting request ${request.id}`);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // Mission name - SIMPLE ET DIRECT
  let missionName = "Sans mission";
  let missionClient = "Sans client";
  
  if (request.missions?.client) {
    missionName = request.missions.client;
    missionClient = request.missions.client;
  } else if (request.missions?.name) {
    missionName = request.missions.name;
    missionClient = request.missions.client || "Sans client";
  } else if (request.mission_client) {
    missionName = request.mission_client;
    missionClient = request.mission_client;
  } else if (request.mission_name) {
    missionName = request.mission_name;
    missionClient = request.mission_client || "Sans client";
  }
  
  console.log(`[formatRequestFromDb] ✅ Mission: "${missionName}" pour request ${request.id}`);

  // Normaliser les détails - AMÉLIORATION CRITIQUE
  let details: Record<string, any> = {};
  if (typeof request.details === 'string') {
    try {
      details = JSON.parse(request.details);
    } catch (e) {
      console.warn(`[formatRequestFromDb] ⚠️ Erreur parsing JSON details pour ${request.id}:`, e);
      details = {};
    }
  } else if (request.details && typeof request.details === 'object') {
    details = request.details as Record<string, any>;
  }

  console.log(`[formatRequestFromDb] 📋 Détails extraits pour ${request.id}:`, details);

  const baseRequest: Request = {
    id: request.id,
    title: request.title,
    type: request.type,
    status: request.status as RequestStatus,
    createdBy: request.created_by,
    missionId: request.mission_id,
    missionName: missionName,
    missionClient: missionClient,
    sdrName: request.created_by_profile?.name || request.sdr_name || "Non assigné",
    assignedToName: request.assigned_to_profile?.name || request.assigned_to_name || "Non assigné",
    dueDate: request.due_date,
    details: details,
    workflow_status: request.workflow_status as WorkflowStatus,
    assigned_to: request.assigned_to,
    isLate,
    createdAt,
    lastUpdated,
    target_role: request.target_role
  } as Request;

  // Pour les demandes email, s'assurer que toutes les propriétés sont correctement extraites
  if (request.type === "email") {
    console.log(`[formatRequestFromDb] 📧 Traitement demande email avec détails:`, details);
    
    // Extraire template
    const template = details.template || {
      content: "",
      webLink: "",
      fileUrl: "",
      subject: ""
    };
    
    // Extraire database
    const database = details.database || {
      notes: "",
      fileUrl: "",
      webLink: "",
      webLinks: []
    };
    
    // Extraire blacklist
    const blacklist = details.blacklist || {
      accounts: { notes: "", fileUrl: "" },
      emails: { notes: "", fileUrl: "" }
    };
    
    // S'assurer que blacklist a les bonnes propriétés
    if (!blacklist.accounts) blacklist.accounts = { notes: "", fileUrl: "" };
    if (!blacklist.emails) blacklist.emails = { notes: "", fileUrl: "" };
    
    // Extraire autres propriétés
    const platform = details.platform || "";
    const statistics = details.statistics || { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    const emailType = details.emailType || "Mass email";
    
    console.log(`[formatRequestFromDb] 📧 Email props extraites:`, {
      template,
      database,
      blacklist,
      platform,
      statistics,
      emailType
    });
    
    const emailRequest: EmailCampaignRequest = {
      ...baseRequest,
      type: "email",
      template,
      database,
      blacklist,
      platform,
      statistics,
      emailType
    };
    
    console.log(`[formatRequestFromDb] ✅ Email request formatée:`, emailRequest.id);
    return emailRequest;
  }
  
  // Pour les autres types, utiliser le format de base
  console.log(`[formatRequestFromDb] ✅ Request formaté (type ${request.type}):`, baseRequest.id);
  return baseRequest;
};
