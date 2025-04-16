
import { Request } from "@/types/types";

export function formatRequestFromDb(dbRequest: any): Request {
  // Ajouter des logs pour voir les données exactes reçues de Supabase
  console.log("Données brutes de la requête reçue de Supabase:", dbRequest);
  
  const createdAt = new Date(dbRequest.created_at);
  const dueDate = new Date(dbRequest.due_date);
  const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
  
  const isLate = dueDate < new Date() && 
                 (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
  
  // Get SDR name from relationships
  const sdrName = dbRequest.created_by_profile?.name || "Non assigné";
  
  // Get assigned person name
  const assignedToName = dbRequest.assigned_profile?.name || null;
  
  // Get specific details for the request type
  const details = dbRequest.details || {};
  
  // Récupération du nom de la mission - Amélioration pour le profil Growth
  let missionName = "Mission sans nom";
  
  // Vérifier et traiter les données de mission selon leur structure
  if (dbRequest.missions) {
    // Pour le profil Growth, missions est un objet direct (pas un tableau)
    if (dbRequest.missions && typeof dbRequest.missions === 'object') {
      // Si c'est un objet avec propriété name ou client, l'utiliser
      if (dbRequest.missions.name || dbRequest.missions.client) {
        missionName = dbRequest.missions.name || dbRequest.missions.client;
        console.log("Nom de mission récupéré depuis l'objet missions pour Growth:", missionName);
      }
    }
    // Si missions est un tableau (cas du profil SDR)
    else if (Array.isArray(dbRequest.missions) && dbRequest.missions.length > 0) {
      missionName = dbRequest.missions[0].name || dbRequest.missions[0].client || "Mission sans nom";
      console.log("Nom de mission récupéré d'un tableau:", missionName);
    }
  } else if (dbRequest.mission_name) {
    // Cas où le nom de mission est directement dans la requête
    missionName = dbRequest.mission_name;
    console.log("Nom de mission récupéré directement:", missionName);
  }
  
  console.log("Mission name final pour la requête", dbRequest.id, ":", missionName);
  
  // Build the base request
  const baseRequest: Request = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.mission_id,
    missionName: missionName,
    createdBy: dbRequest.created_by,
    sdrName,
    createdAt,
    dueDate,
    status: dbRequest.status,
    workflow_status: dbRequest.workflow_status || 'pending_assignment',
    target_role: dbRequest.target_role || 'growth',
    assigned_to: dbRequest.assigned_to || null,
    assignedToName,
    lastUpdated,
    isLate,
    details
  };

  // Add type-specific fields
  switch(dbRequest.type) {
    case 'email':
      return {
        ...baseRequest,
        template: details.template || { content: "", fileUrl: "", webLink: "" },
        database: details.database || { notes: "", fileUrl: "", webLink: "" },
        blacklist: details.blacklist || {
          accounts: { notes: "", fileUrl: "" },
          emails: { notes: "", fileUrl: "" }
        },
        platform: details.platform || "",
        statistics: details.statistics || { sent: 0, opened: 0, clicked: 0, bounced: 0 }
      };
    case 'database':
      return {
        ...baseRequest,
        type: "database",
        tool: details.tool || "",
        targeting: details.targeting || {
          jobTitles: [],
          industries: [],
          locations: [],
          companySize: [],
          otherCriteria: ""
        },
        blacklist: details.blacklist || {
          accounts: { notes: "", fileUrl: "" }
        },
        contactsCreated: details.contactsCreated || 0
      };
    case 'linkedin':
      return {
        ...baseRequest,
        type: "linkedin",
        targeting: details.targeting || {
          jobTitles: [],
          industries: [],
          locations: [],
          companySize: [],
          otherCriteria: ""
        },
        profilesScraped: details.profilesScraped || 0,
        resultFileUrl: details.resultFileUrl || ""
      };
    default:
      return baseRequest;
  }
}
