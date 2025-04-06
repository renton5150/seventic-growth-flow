
// Re-export all request service functions
export * from './baseRequestService';
export * from './emailRequestService';
export * from './databaseRequestService';
export * from './linkedinRequestService';
export * from './utils';

import { Request, RequestStatus, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { updateEmailRequest } from "./emailRequestService";
import { updateDatabaseRequest } from "./databaseRequestService";
import { updateLinkedInRequest } from "./linkedinRequestService";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Type guard to check if an object has a template property
 */
function hasTemplate(obj: Partial<Request>): obj is Partial<EmailCampaignRequest> {
  return "template" in obj;
}

/**
 * Type guard to check if an object has a tool property
 */
function hasTool(obj: Partial<Request>): obj is Partial<DatabaseRequest> {
  return "tool" in obj;
}

/**
 * Type guard to check if an object has a targeting property but not a tool property
 */
function hasTargetingWithoutTool(obj: Partial<Request>): obj is Partial<LinkedInScrapingRequest> {
  return "targeting" in obj && !("tool" in obj);
}

/**
 * Generic request update function that delegates to the appropriate type-specific update function
 */
export const updateRequest = async (requestId: string, updates: Partial<Request>): Promise<Request | undefined> => {
  try {
    console.log("Mise à jour de la requête:", requestId, "avec les données:", updates);
    
    // Determine the request type and call the appropriate update function
    if (updates.type === "email" || (!updates.type && hasTemplate(updates))) {
      return updateEmailRequest(requestId, updates as Partial<EmailCampaignRequest>);
    } 
    else if (updates.type === "database" || (!updates.type && hasTool(updates))) {
      return updateDatabaseRequest(requestId, updates as Partial<DatabaseRequest>);
    }
    else if (updates.type === "linkedin" || (!updates.type && hasTargetingWithoutTool(updates))) {
      return updateLinkedInRequest(requestId, updates as Partial<LinkedInScrapingRequest>);
    }
    else {
      // Generic update for common fields only
      const { data: updatedRequest, error } = await supabase
        .from('requests')
        .update({
          title: updates.title,
          due_date: updates.dueDate?.toISOString(),
          status: updates.status,
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la mise à jour générique de la requête:", error);
        return undefined;
      }

      return formatRequestFromDb(updatedRequest);
    }
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête:", error);
    return undefined;
  }
};
