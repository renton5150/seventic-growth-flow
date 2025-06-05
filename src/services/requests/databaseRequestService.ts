
import { DatabaseRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Créer une requête de base de données
 */
export const createDatabaseRequest = async (requestData: any): Promise<DatabaseRequest | undefined> => {
  try {
    console.log("Préparation des données pour la création de la requête de base de données:", requestData);
    
    // Convertir correctement la date - elle arrive comme string au format YYYY-MM-DD
    let dueDateISO: string;
    if (typeof requestData.dueDate === 'string') {
      // Si c'est une string, la convertir en Date puis en ISO
      const dateObj = new Date(requestData.dueDate);
      dueDateISO = dateObj.toISOString();
    } else if (requestData.dueDate instanceof Date) {
      dueDateISO = requestData.dueDate.toISOString();
    } else {
      // Fallback: utiliser 7 jours à partir d'aujourd'hui
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 7);
      dueDateISO = fallbackDate.toISOString();
    }
    
    const dbRequest = {
      type: "database",
      title: requestData.title,
      mission_id: requestData.missionId,
      created_by: requestData.createdBy,
      created_at: new Date().toISOString(),
      status: "pending", // Utilisons "pending" au lieu de "en attente" pour correspondre à la contrainte de la base de données
      due_date: dueDateISO,
      last_updated: new Date().toISOString(),
      details: {
        tool: requestData.tool,
        targeting: requestData.targeting,
        blacklist: requestData.blacklist
      }
    };
    
    console.log("Données formatées pour l'insertion:", JSON.stringify(dbRequest, null, 2));

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de base de données:", error);
      console.error("Détails de l'erreur:", error.details);
      console.error("Message d'erreur:", error.message);
      console.error("Code d'erreur:", error.code);
      return undefined;
    }

    console.log("Nouvelle requête de base de données créée avec succès:", newRequest);
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
    // Préparation des données pour la mise à jour dans Supabase
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.dueDate) {
      // Handle string dates properly
      dbUpdates.due_date = typeof updates.dueDate === 'string' 
        ? updates.dueDate 
        : updates.dueDate;
    }
    if (updates.status) dbUpdates.status = updates.status;

    // Gérer les détails spécifiques au type database
    if (updates.tool || updates.targeting || updates.blacklist) {
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
      
      // Mettre à jour l'outil
      if (updates.tool) {
        dbUpdates.details.tool = updates.tool;
      } else if (currentDetails.tool) {
        dbUpdates.details.tool = currentDetails.tool;
      }
      
      // Mettre à jour le ciblage
      if (updates.targeting) {
        dbUpdates.details.targeting = {
          ...(currentDetails.targeting || {}),
          ...updates.targeting
        };
      } else if (currentDetails.targeting) {
        dbUpdates.details.targeting = currentDetails.targeting;
      }
      
      // Mettre à jour la blacklist
      if (updates.blacklist) {
        dbUpdates.details.blacklist = {
          ...(currentDetails.blacklist || {}),
          ...updates.blacklist
        };
      } else if (currentDetails.blacklist) {
        dbUpdates.details.blacklist = currentDetails.blacklist;
      }
      
      // Mettre à jour les contacts créés
      if (updates.contactsCreated !== undefined) {
        dbUpdates.details.contactsCreated = updates.contactsCreated;
      } else if (currentDetails.contactsCreated !== undefined) {
        dbUpdates.details.contactsCreated = currentDetails.contactsCreated;
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
      console.error("Erreur lors de la mise à jour de la requête de base de données:", error);
      return undefined;
    }

    return formatRequestFromDb(updatedRequest) as DatabaseRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête de base de données:", error);
    return undefined;
  }
};
