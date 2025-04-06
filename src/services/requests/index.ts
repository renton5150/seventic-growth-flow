
// Re-export all request service functions
export * from './baseRequestService';
export * from './emailRequestService';
export * from './databaseRequestService';
export * from './linkedinRequestService';
export * from './utils';

import { Request, RequestStatus } from "@/types/types";
import { updateEmailRequest } from "./emailRequestService";
import { updateDatabaseRequest } from "./databaseRequestService";
import { updateLinkedInRequest } from "./linkedinRequestService";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Generic request update function that delegates to the appropriate type-specific update function
 */
export const updateRequest = async (requestId: string, updates: Partial<Request>): Promise<Request | undefined> => {
  try {
    console.log("Mise à jour de la requête:", requestId, "avec les données:", updates);
    
    // Determine the request type and call the appropriate update function
    if (updates.type === "email" || (!updates.type && "template" in updates)) {
      return updateEmailRequest(requestId, updates);
    } 
    else if (updates.type === "database" || (!updates.type && "tool" in updates)) {
      return updateDatabaseRequest(requestId, updates);
    }
    else if (updates.type === "linkedin" || (!updates.type && "targeting" in updates && !("tool" in updates))) {
      return updateLinkedInRequest(requestId, updates);
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
