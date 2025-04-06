
import { DatabaseRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Créer une requête de base de données
 */
export const createDatabaseRequest = async (requestData: any): Promise<DatabaseRequest | undefined> => {
  try {
    const dbRequest = {
      type: "database",
      title: requestData.title,
      mission_id: requestData.missionId,
      created_by: requestData.createdBy,
      created_at: new Date().toISOString(),
      status: "pending",
      due_date: requestData.dueDate.toISOString(),
      last_updated: new Date().toISOString(),
      details: {
        tool: requestData.tool,
        targeting: requestData.targeting,
        blacklist: requestData.blacklist
      }
    };

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de base de données:", error);
      return undefined;
    }

    return formatRequestFromDb(newRequest) as DatabaseRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la requête de base de données:", error);
    return undefined;
  }
};

/**
 * Update a database request with specific fields
 */
export const updateDatabaseRequest = async (requestId: string, updates: Partial<DatabaseRequest>): Promise<DatabaseRequest | undefined> => {
  try {
    // Implementation would be similar to updateEmailRequest but tailored for database requests
    // This is a placeholder for future implementation if needed
    return undefined;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête de base de données:", error);
    return undefined;
  }
};
