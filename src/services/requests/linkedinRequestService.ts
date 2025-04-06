
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
    // Préparation des données pour la mise à jour dans Supabase
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate.toISOString();
    if (updates.status) dbUpdates.status = updates.status;

    // Gérer les détails spécifiques au type LinkedIn
    if (updates.targeting || updates.profilesScraped !== undefined || updates.resultFileUrl) {
      // Récupérer les détails actuels pour les mettre à jour correctement
      const { data: currentRequest } = await supabase
        .from('requests')
        .select('details')
        .eq('id', requestId)
        .single();
        
      // S'assurer que currentRequest.details est un objet
      let currentDetails: Record<string, any> = {};
      if (currentRequest && typeof currentRequest.details === 'object' && currentRequest.details !== null) {
        currentDetails = currentRequest.details as Record<string, any>;
      }
      
      // Initialiser l'objet details
      dbUpdates.details = {};
      
      // Mettre à jour le ciblage
      if (updates.targeting) {
        dbUpdates.details.targeting = {
          ...(currentDetails.targeting || {}),
          ...updates.targeting
        };
      } else if (currentDetails.targeting) {
        dbUpdates.details.targeting = currentDetails.targeting;
      }
      
      // Mettre à jour les profils scrapés
      if (updates.profilesScraped !== undefined) {
        dbUpdates.details.profilesScraped = updates.profilesScraped;
      } else if (currentDetails.profilesScraped !== undefined) {
        dbUpdates.details.profilesScraped = currentDetails.profilesScraped;
      }
      
      // Mettre à jour l'URL du fichier résultat
      if (updates.resultFileUrl) {
        dbUpdates.details.resultFileUrl = updates.resultFileUrl;
      } else if (currentDetails.resultFileUrl) {
        dbUpdates.details.resultFileUrl = currentDetails.resultFileUrl;
      }
    }
    
    dbUpdates.last_updated = new Date().toISOString();

    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update(dbUpdates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour de la requête LinkedIn:", error);
      return undefined;
    }

    return formatRequestFromDb(updatedRequest) as LinkedInScrapingRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête LinkedIn:", error);
    return undefined;
  }
};
