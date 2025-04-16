
import { Request } from "@/types/types";

export function formatRequestFromDb(dbRequest: any): Request {
  // Ajouter des logs pour voir les données exactes reçues de Supabase
  console.log("Données brutes de la requête reçue de Supabase:", dbRequest);
  console.log("Relation mission:", dbRequest.missions);
  
  const createdAt = new Date(dbRequest.created_at);
  const dueDate = new Date(dbRequest.due_date);
  const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
  
  const isLate = dueDate < new Date() && 
                 (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
  
  // Get SDR name from relationships with the new query format
  const sdrName = dbRequest.created_by_profile?.name || "Non assigné";
  
  // Get assigned person name with the new query format
  const assignedToName = dbRequest.assigned_profile?.name || null;
  
  // Get specific details for the request type
  const details = dbRequest.details || {};
  
  // Récupération prioritaire du nom de la mission depuis la relation
  // Utiliser prioritairement le champ 'name' de la mission liée, avec fallbacks
  let missionName = null;
  if (dbRequest.missions) {
    missionName = dbRequest.missions.name || dbRequest.missions.client;
    console.log("Nom de mission récupéré:", missionName);
  } else {
    console.log("Aucune relation mission trouvée pour la requête:", dbRequest.id);
  }
  
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
