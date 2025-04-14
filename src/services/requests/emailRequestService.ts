
import { EmailCampaignRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Créer une requête de campagne email
 */
export const createEmailCampaignRequest = async (requestData: any): Promise<EmailCampaignRequest | undefined> => {
  try {
    console.log("Préparation des données pour la création de la requête:", requestData);
    
    const dbRequest = {
      type: "email",
      title: requestData.title,
      mission_id: requestData.missionId,
      created_by: requestData.createdBy,
      created_at: new Date().toISOString(),
      status: "pending",
      due_date: requestData.dueDate.toISOString(),
      last_updated: new Date().toISOString(),
      details: {
        template: requestData.template,
        database: requestData.database,
        blacklist: requestData.blacklist
      }
    };
    
    console.log("Données formatées pour l'insertion:", dbRequest);

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de campagne email:", error);
      return undefined;
    }

    console.log("Nouvelle requête créée avec succès:", newRequest);
    return formatRequestFromDb(newRequest) as EmailCampaignRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la requête de campagne email:", error);
    return undefined;
  }
};

/**
 * Update an email request with specific fields
 */
export const updateEmailRequest = async (requestId: string, updates: Partial<EmailCampaignRequest>): Promise<EmailCampaignRequest | undefined> => {
  try {
    console.log("Mise à jour de la requête email:", requestId, "avec les données:", updates);
    
    // Préparation des données pour la mise à jour dans Supabase
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate.toISOString();
    if (updates.status) dbUpdates.status = updates.status;

    // Gérer les détails spécifiques au type email
    if (updates.template || updates.database || updates.blacklist) {
      // Récupérer les détails actuels pour les mettre à jour correctement
      const { data: currentRequest } = await supabase
        .from('requests')
        .select('details')
        .eq('id', requestId)
        .single();
        
      // S'assurer que currentRequest.details est un objet et non une primitive
      let currentDetails: Record<string, any> = {};
      if (currentRequest && typeof currentRequest.details === 'object' && currentRequest.details !== null) {
        currentDetails = currentRequest.details as Record<string, any>;
      }
      
      // Initialiser l'objet details s'il n'existe pas encore
      dbUpdates.details = {};
      
      // Mettre à jour les propriétés du template
      if (updates.template) {
        const currentTemplate = (currentDetails.template && typeof currentDetails.template === 'object') 
          ? currentDetails.template as Record<string, any>
          : {};
          
        dbUpdates.details.template = {
          ...currentTemplate,
          ...updates.template
        };
      } else if (currentDetails.template && typeof currentDetails.template === 'object') {
        dbUpdates.details.template = currentDetails.template;
      }
      
      // Mettre à jour les propriétés de la base de données
      if (updates.database) {
        const currentDatabase = (currentDetails.database && typeof currentDetails.database === 'object') 
          ? currentDetails.database as Record<string, any>
          : {};
          
        dbUpdates.details.database = {
          ...currentDatabase,
          ...updates.database
        };
      } else if (currentDetails.database && typeof currentDetails.database === 'object') {
        dbUpdates.details.database = currentDetails.database;
      }
      
      // Mettre à jour les propriétés de la blacklist
      if (updates.blacklist) {
        const currentBlacklist = (currentDetails.blacklist && typeof currentDetails.blacklist === 'object') 
          ? currentDetails.blacklist as Record<string, any>
          : {};
          
        dbUpdates.details.blacklist = {
          ...currentBlacklist,
          ...updates.blacklist
        };
      } else if (currentDetails.blacklist && typeof currentDetails.blacklist === 'object') {
        dbUpdates.details.blacklist = currentDetails.blacklist;
      }
    }
    
    // Toujours mettre à jour le timestamp last_updated
    dbUpdates.last_updated = new Date().toISOString();

    console.log("Données formatées pour Supabase:", dbUpdates);

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(dbUpdates)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour de la requête:", updateError);
      return undefined;
    }

    console.log("Requête mise à jour avec succès:", updatedRequest);
    return formatRequestFromDb(updatedRequest) as EmailCampaignRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête:", error);
    return undefined;
  }
};
