
import { Request } from "@/types/types";

export function formatRequestFromDb(dbRequest: any): Request {
  const createdAt = new Date(dbRequest.created_at);
  const dueDate = new Date(dbRequest.due_date);
  const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
  
  const isLate = dueDate < new Date() && 
                 (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
  
  // Obtenir le nom du SDR à partir des relations
  const sdrName = dbRequest.profiles?.name || 
                  dbRequest.created_by_profile?.name || 
                  "Non assigné";
  
  // Obtenir le nom de la personne assignée
  const assignedToName = dbRequest.assigned_profile?.name || null;
  
  // Récupérer les détails spécifiques au type de requête
  const details = dbRequest.details || {};
  
  // Construire la requête de base
  const baseRequest: Request = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.mission_id,
    missionName: dbRequest.missions?.name,
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

  // Ajouter les champs spécifiques au type
  switch(dbRequest.type) {
    case 'email':
      return {
        ...baseRequest,
        template: details.template || {},
        database: details.database || {},
        blacklist: details.blacklist || {},
        platform: details.platform,
        statistics: details.statistics
      };
    case 'database':
      return {
        ...baseRequest,
        tool: details.tool,
        targeting: details.targeting || {},
        blacklist: details.blacklist || {},
        contactsCreated: details.contactsCreated
      };
    case 'linkedin':
      return {
        ...baseRequest,
        targeting: details.targeting || {},
        profilesScraped: details.profilesScraped,
        resultFileUrl: details.resultFileUrl
      };
    default:
      return baseRequest;
  }
}
