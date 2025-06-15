
import { EmailCampaignRequest } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "./utils";

/**
 * Créer une requête de campagne email
 */
export const createEmailCampaignRequest = async (requestData: any): Promise<EmailCampaignRequest | undefined> => {
  try {
    console.log("Préparation des données pour la création de la requête:", requestData);
    
    // Assurez-vous que tous les objets imbriqués existent
    const template = requestData.template || { content: "", fileUrl: "", webLink: "", subject: "" };
    const database = requestData.database || { notes: "", fileUrl: "", fileUrls: [], webLinks: [] };
    const blacklist = requestData.blacklist || {
      accounts: { notes: "", fileUrl: "" },
      emails: { notes: "", fileUrl: "" }
    };
    
    // Gérer la migration et la rétrocompatibilité pour fileUrls
    let processedDatabase = { ...database };
    if (database.fileUrls && database.fileUrls.length > 0) {
      // Si fileUrls est fourni, s'assurer que fileUrl est également défini pour la rétrocompatibilité
      processedDatabase.fileUrls = database.fileUrls;
      processedDatabase.fileUrl = database.fileUrls[0]; // Premier fichier pour rétrocompatibilité
    } else if (database.fileUrl) {
      // Si seulement fileUrl est fourni, créer fileUrls à partir de ça
      processedDatabase.fileUrls = [database.fileUrl];
      processedDatabase.fileUrl = database.fileUrl;
    } else {
      // Aucun fichier
      processedDatabase.fileUrls = [];
      processedDatabase.fileUrl = "";
    }
    
    // Assurez-vous que blacklist.accounts et blacklist.emails existent
    if (!blacklist.accounts) blacklist.accounts = { notes: "", fileUrl: "" };
    if (!blacklist.emails) blacklist.emails = { notes: "", fileUrl: "" };
    
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
      type: "email",
      title: requestData.title,
      mission_id: requestData.missionId,
      created_by: requestData.createdBy,
      created_at: new Date().toISOString(),
      status: "pending", // Utilisons "pending" au lieu de "en attente" pour correspondre à la contrainte de la base de données
      workflow_status: "pending_assignment",
      target_role: "growth",
      due_date: dueDateISO,
      last_updated: new Date().toISOString(),
      details: {
        emailType: requestData.emailType || "Mass email",
        template: template,
        database: processedDatabase,
        blacklist: blacklist
      }
    };
    
    console.log("Données formatées pour l'insertion:", JSON.stringify(dbRequest, null, 2));

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de campagne email:", error);
      console.error("Détails de l'erreur:", error.details);
      console.error("Message d'erreur:", error.message);
      console.error("Code d'erreur:", error.code);
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
    if (updates.dueDate) {
      // Handle string dates properly
      dbUpdates.due_date = typeof updates.dueDate === 'string' 
        ? updates.dueDate 
        : updates.dueDate;
    }
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.workflow_status) dbUpdates.workflow_status = updates.workflow_status;
    if ('assigned_to' in updates) dbUpdates.assigned_to = updates.assigned_to;

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
    // Assurez-vous que currentRequest.details est un objet valide
    let currentDetails = {};
    if (typeof currentRequest.details === 'string') {
      try {
        currentDetails = JSON.parse(currentRequest.details);
      } catch (e) {
        console.error("Erreur lors du parsing des détails:", e);
        currentDetails = {};
      }
    } else if (currentRequest.details && typeof currentRequest.details === 'object') {
      currentDetails = currentRequest.details;
    }
    
    dbUpdates.details = { ...currentDetails };
    
    // Initialiser les objets imbriqués s'ils n'existent pas
    if (!dbUpdates.details.template) dbUpdates.details.template = {};
    if (!dbUpdates.details.database) dbUpdates.details.database = {};
    if (!dbUpdates.details.blacklist) dbUpdates.details.blacklist = { accounts: {}, emails: {} };
    if (!dbUpdates.details.blacklist.accounts) dbUpdates.details.blacklist.accounts = {};
    if (!dbUpdates.details.blacklist.emails) dbUpdates.details.blacklist.emails = {};
    
    // Mettre à jour le type d'emailing si présent dans les updates
    if (updates.emailType) {
      dbUpdates.details.emailType = updates.emailType;
    }
    
    // Mettre à jour template si présent dans les updates
    if (updates.template) {
      dbUpdates.details.template = {
        ...dbUpdates.details.template,
        ...updates.template
      };
    }
    
    // Mettre à jour database si présent dans les updates
    if (updates.database) {
      const database = updates.database;
      
      dbUpdates.details.database = {
        ...dbUpdates.details.database,
        ...database
      };
    }
    
    // Mettre à jour blacklist si présent dans les updates
    if (updates.blacklist) {
      const blacklist = updates.blacklist;
      
      // Ensure all objects exist and are structured properly
      dbUpdates.details.blacklist = {
        ...dbUpdates.details.blacklist,
        ...(blacklist || {})
      };

      if (blacklist?.accounts) {
        dbUpdates.details.blacklist.accounts = {
          ...dbUpdates.details.blacklist.accounts,
          ...blacklist.accounts
        };
      }
      
      if (blacklist?.emails) {
        dbUpdates.details.blacklist.emails = {
          ...dbUpdates.details.blacklist.emails,
          ...blacklist.emails
        };
      }
    }
    
    // Toujours mettre à jour le timestamp last_updated
    dbUpdates.last_updated = new Date().toISOString();

    console.log("Données formatées pour Supabase:", JSON.stringify(dbUpdates, null, 2));

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
