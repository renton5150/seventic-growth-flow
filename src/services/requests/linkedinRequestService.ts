
import { LinkedInScrapingRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Créer une requête de scraping LinkedIn
 */
export const createLinkedInScrapingRequest = async (requestData: any): Promise<LinkedInScrapingRequest | undefined> => {
  try {
    const dbRequest = {
      type: "linkedin",
      title: requestData.title,
      mission_id: requestData.missionId,
      created_by: requestData.createdBy,
      created_at: new Date().toISOString(),
      status: "pending",
      due_date: requestData.dueDate.toISOString(),
      last_updated: new Date().toISOString(),
      details: {
        targeting: requestData.targeting
      }
    };

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de scraping LinkedIn:", error);
      return undefined;
    }

    return formatRequestFromDb(newRequest) as LinkedInScrapingRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la requête de scraping LinkedIn:", error);
    return undefined;
  }
};

/**
 * Update a LinkedIn request with specific fields
 */
export const updateLinkedInRequest = async (requestId: string, updates: Partial<LinkedInScrapingRequest>): Promise<LinkedInScrapingRequest | undefined> => {
  try {
    // Implementation would be similar to updateEmailRequest but tailored for LinkedIn requests
    // This is a placeholder for future implementation if needed
    return undefined;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête de scraping LinkedIn:", error);
    return undefined;
  }
};
