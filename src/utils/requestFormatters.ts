
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { getMissionName, KNOWN_MISSIONS, forceRefreshFreshworks, isFreshworksId, syncKnownMissions } from "@/services/missionNameService";

// Format request data from the database
export const formatRequestFromDb = async (request: any): Promise<Request> => {
  console.log(`[formatRequestFromDb] START Formatting request ${request.id}, mission_id: ${request.mission_id}`);
  
  // Convert dates
  const createdAt = new Date(request.created_at);
  const lastUpdated = new Date(request.last_updated || request.updated_at);
  const dueDate = new Date(request.due_date);
  
  // Calculate if the request is late
  const isLate = dueDate < new Date() && request.workflow_status !== 'completed' && request.workflow_status !== 'canceled';
  
  // Traitement spécial pour Freshworks - TOUJOURS PRIORITAIRE - Utilise la fonction unifiée
  const isFreshworksMission = isFreshworksId(request.mission_id);
  
  // Forcer le rafraîchissement du cache Freshworks quelle que soit la requête
  forceRefreshFreshworks();
  
  // AMÉLIORATION MAJEURE : Récupération systématique du nom de mission
  let missionName = "Sans mission";
  
  if (isFreshworksMission) {
    missionName = "Freshworks";
    console.log("[formatRequestFromDb] Mission Freshworks détectée - traitement prioritaire");
  } 
  else if (request.mission_id) {
    // TOUJOURS utiliser le service centralisé pour la cohérence
    missionName = await getMissionName(request.mission_id, {
      fallbackClient: request.mission_client, 
      fallbackName: request.mission_name,
      forceRefresh: false // Pas de force refresh systématique pour les performances
    });
    
    console.log(`[formatRequestFromDb] Nom de mission récupéré pour ${request.mission_id}: "${missionName}"`);
    
    // CORRECTION : Si on obtient un nom technique, forcer une synchronisation et réessayer
    if (missionName.startsWith("Mission ") && missionName.length < 20) {
      console.log(`[formatRequestFromDb] Nom technique détecté "${missionName}", tentative de re-synchronisation`);
      
      try {
        // Force une re-synchronisation
        await syncKnownMissions();
        
        // Nouvel essai avec force refresh
        missionName = await getMissionName(request.mission_id, {
          fallbackClient: request.mission_client, 
          fallbackName: request.mission_name,
          forceRefresh: true
        });
        
        console.log(`[formatRequestFromDb] Après re-sync, nouveau nom: "${missionName}"`);
      } catch (err) {
        console.error(`[formatRequestFromDb] Erreur lors de la re-synchronisation:`, err);
      }
    }
  }
  
  console.log(`[formatRequestFromDb] FINAL mission name pour request ${request.id}: "${missionName}"`);

  // IMPORTANT: Normaliser les détails pour éviter les problèmes de type
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
