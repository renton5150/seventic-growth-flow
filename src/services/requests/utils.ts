
import { Request, RequestStatus } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Formats a request object from database format to application format
 */
export const formatRequestFromDb = (dbRequest: any): Request => {
  const baseRequest = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.mission_id,
    createdBy: dbRequest.created_by,
    createdAt: new Date(dbRequest.created_at),
    status: dbRequest.status as RequestStatus,
    dueDate: new Date(dbRequest.due_date),
    lastUpdated: new Date(dbRequest.last_updated),
    isLate: new Date(dbRequest.due_date) < new Date() && dbRequest.status !== "completed",
    sdrName: dbRequest.sdr_name
  };

  // Utiliser le champ details de la BD pour stocker les données spécifiques au type
  const details = dbRequest.details || {};

  switch (dbRequest.type) {
    case "email":
      return {
        ...baseRequest,
        type: "email",
        template: details.template || {},
        database: details.database || {},
        blacklist: details.blacklist || {},
        platform: details.platform,
        statistics: details.statistics
      } as any;
    case "database":
      return {
        ...baseRequest,
        type: "database",
        tool: details.tool,
        targeting: details.targeting || {},
        blacklist: details.blacklist || {},
        contactsCreated: details.contactsCreated
      } as any;
    case "linkedin":
      return {
        ...baseRequest,
        type: "linkedin",
        targeting: details.targeting || {},
        profilesScraped: details.profilesScraped,
        resultFileUrl: details.resultFileUrl
      } as any;
    default:
      return baseRequest as Request;
  }
};
