
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
      workflow_status: "pending_assignment",
      target_role: "growth",
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

export const updateEmailRequest = async (requestId: string, updates: Partial<EmailCampaignRequest>): Promise<EmailCampaignRequest | undefined> => {
  try {
    console.log("Mise à jour de la requête email:", requestId, "avec les données:", updates);
    
    // Préparation des données pour la mise à jour dans Supabase
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate.toISOString();
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.workflow_status) dbUpdates.workflow_status = updates.workflow_status;
    if (updates.assigned_to) dbUpdates.assigned_to = updates.assigned_to;

    // Récupérer d'abord la requête actuelle pour fusionner correctement les détails
    const { data: currentRequest } = await supabase
      .from('requests')
      .select('details')
      .eq('id', requestId)
      .single();
      
    if (!currentRequest) {
      console.error("La requête à mettre à jour n'existe pas");
      return undefined;
    }

    // Initialiser l'objet details à partir des données actuelles
    const currentDetails = currentRequest.details || {};
    dbUpdates.details = { ...currentDetails };
    
    // Mettre à jour template si présent dans les updates
    if (updates.template) {
      const template = updates.template || {};
      const currentTemplateObj = dbUpdates.details.template || {};
      
      dbUpdates.details.template = {
        ...currentTemplateObj,
        ...template
      };
    }
    
    // Mettre à jour database si présent dans les updates
    if (updates.database) {
      const database = updates.database || {};
      const currentDatabaseObj = dbUpdates.details.database || {};
      
      dbUpdates.details.database = {
        ...currentDatabaseObj,
        ...database
      };
    }
    
    // Mettre à jour blacklist si présent dans les updates
    if (updates.blacklist) {
      const blacklist = updates.blacklist || {};
      const currentBlacklistObj = dbUpdates.details.blacklist || {};
      
      // Ensure blacklist is always an object
      dbUpdates.details.blacklist = {
        ...currentBlacklistObj,
        ...blacklist,
        accounts: {
          ...(currentBlacklistObj?.accounts || {}),
          ...(blacklist?.accounts || {})
        },
        emails: {
          ...(currentBlacklistObj?.emails || {}),
          ...(blacklist?.emails || {})
        }
      };
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
