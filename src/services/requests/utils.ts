
import { Request, RequestStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Formats a request object from database format to application format
 */
export const formatRequestFromDb = (dbRequest: any): Request => {
  // Journaliser l'entrée pour debug
  console.log("formatRequestFromDb - Entrée:", JSON.stringify(dbRequest, null, 2));
  
  // Gérer correctement les détails JSON
  let details: Record<string, any> = {};
  if (dbRequest.details) {
    if (typeof dbRequest.details === 'string') {
      try {
        details = JSON.parse(dbRequest.details);
      } catch (e) {
        details = {};
      }
    } else if (typeof dbRequest.details === 'object' && dbRequest.details !== null) {
      details = dbRequest.details as Record<string, any>;
    }
  }
  
  const baseRequest: Request = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.mission_id,
    missionName: dbRequest.mission_name || "Sans mission",
    missionClient: dbRequest.mission_client || "Sans client",
    createdBy: dbRequest.created_by,
    createdAt: new Date(dbRequest.created_at),
    status: dbRequest.status as RequestStatus,
    dueDate: dbRequest.due_date, // Keep as string from database
    lastUpdated: new Date(dbRequest.last_updated),
    isLate: new Date(dbRequest.due_date) < new Date() && dbRequest.status !== "completed",
    sdrName: dbRequest.sdr_name || "Non assigné",
    workflow_status: dbRequest.workflow_status,
    assigned_to: dbRequest.assigned_to,
    assignedToName: dbRequest.assigned_to_name || "Non assigné",
    target_role: dbRequest.target_role,
    details: details
  };

  console.log("formatRequestFromDb - Détails extraits:", JSON.stringify(details, null, 2));

  switch (dbRequest.type) {
    case "email":
      const emailRequest = {
        ...baseRequest,
        type: "email",
        template: details.template || {},
        database: details.database || {},
        blacklist: details.blacklist || {},
        platform: details.platform,
        statistics: details.statistics,
        emailType: details.emailType || "Mass email",
      };
      console.log("formatRequestFromDb - Résultat email:", JSON.stringify(emailRequest, null, 2));
      return emailRequest as any;
      
    case "database":
      const databaseRequest = {
        ...baseRequest,
        type: "database",
        tool: details.tool,
        targeting: details.targeting || {},
        blacklist: details.blacklist || {},
        contactsCreated: details.contactsCreated,
        resultFileUrl: details.resultFileUrl,
      };
      console.log("formatRequestFromDb - Résultat database:", JSON.stringify(databaseRequest, null, 2));
      return databaseRequest as any;
      
    case "linkedin":
      const linkedinRequest = {
        ...baseRequest,
        type: "linkedin",
        targeting: details.targeting || {},
        profilesScraped: details.profilesScraped,
        resultFileUrl: details.resultFileUrl,
      };
      console.log("formatRequestFromDb - Résultat linkedin:", JSON.stringify(linkedinRequest, null, 2));
      return linkedinRequest as any;
      
    default:
      console.log("formatRequestFromDb - Résultat par défaut:", JSON.stringify(baseRequest, null, 2));
      return baseRequest;
  }
};
