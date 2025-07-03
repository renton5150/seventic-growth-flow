
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
    
    // Mise à jour pour supporter les nouvelles structures de blacklist avec plusieurs fichiers
    const blacklist = requestData.blacklist || {
      accounts: { notes: "", fileUrl: "", fileUrls: [] },
      emails: { notes: "", fileUrl: "", fileUrls: [] }
    };
    
    // Gérer la migration et la rétrocompatibilité pour fileUrls dans database
    let processedDatabase = { ...database };
    if (database.fileUrls && database.fileUrls.length > 0) {
      processedDatabase.fileUrls = database.fileUrls;
      processedDatabase.fileUrl = database.fileUrls[0];
    } else if (database.fileUrl) {
      processedDatabase.fileUrls = [database.fileUrl];
      processedDatabase.fileUrl = database.fileUrl;
    } else {
      processedDatabase.fileUrls = [];
      processedDatabase.fileUrl = "";
    }
    
    // Gérer la migration et la rétrocompatibilité pour fileUrls dans blacklist
    let processedBlacklist = { ...blacklist };
    
    // Pour les comptes
    if (blacklist.accounts) {
      if (requestData.blacklistAccountsFileUrls && requestData.blacklistAccountsFileUrls.length > 0) {
        processedBlacklist.accounts.fileUrls = requestData.blacklistAccountsFileUrls;
        processedBlacklist.accounts.fileUrl = requestData.blacklistAccountsFileUrls[0]; // Premier fichier pour rétrocompatibilité
      } else if (blacklist.accounts.fileUrl) {
        processedBlacklist.accounts.fileUrls = [blacklist.accounts.fileUrl];
        processedBlacklist.accounts.fileUrl = blacklist.accounts.fileUrl;
      } else {
        processedBlacklist.accounts.fileUrls = [];
        processedBlacklist.accounts.fileUrl = "";
      }
      processedBlacklist.accounts.notes = blacklist.accounts.notes || "";
    } else {
      processedBlacklist.accounts = { notes: "", fileUrl: "", fileUrls: [] };
    }
    
    // Pour les emails
    if (blacklist.emails) {
      if (requestData.blacklistEmailsFileUrls && requestData.blacklistEmailsFileUrls.length > 0) {
        processedBlacklist.emails.fileUrls = requestData.blacklistEmailsFileUrls;
        processedBlacklist.emails.fileUrl = requestData.blacklistEmailsFileUrls[0]; // Premier fichier pour rétrocompatibilité
      } else if (blacklist.emails.fileUrl) {
        processedBlacklist.emails.fileUrls = [blacklist.emails.fileUrl];
        processedBlacklist.emails.fileUrl = blacklist.emails.fileUrl;
      } else {
        processedBlacklist.emails.fileUrls = [];
        processedBlacklist.emails.fileUrl = "";
      }
      processedBlacklist.emails.notes = blacklist.emails.notes || "";
    } else {
      processedBlacklist.emails = { notes: "", fileUrl: "", fileUrls: [] };
    }
    
    // Convertir correctement la date - elle arrive comme string au format YYYY-MM-DD
    let dueDateISO: string;
    if (typeof requestData.dueDate === 'string') {
      const dateObj = new Date(requestData.dueDate);
      dueDateISO = dateObj.toISOString();
    } else if (requestData.dueDate instanceof Date) {
      dueDateISO = requestData.dueDate.toISOString();
    } else {
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
      status: "pending",
      workflow_status: "pending_assignment",
      target_role: "growth",
      due_date: dueDateISO,
      last_updated: new Date().toISOString(),
      details: {
        emailType: requestData.emailType || "Mass email",
        template: template,
        database: processedDatabase,
        blacklist: processedBlacklist
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
    console.log("🔄 Received data for update:", updates);
    
    // Préparation des données pour la mise à jour dans Supabase
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.dueDate) {
      dbUpdates.due_date = typeof updates.dueDate === 'string' 
        ? updates.dueDate 
        : updates.dueDate;
    }
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.workflow_status) dbUpdates.workflow_status = updates.workflow_status;
    if ('assigned_to' in updates) dbUpdates.assigned_to = updates.assigned_to;

    // Récupérer d'abord la requête actuelle pour gérer correctement les suppressions de fichiers
    const { data: currentRequest } = await supabase
      .from('requests')
      .select('details')
      .eq('id', requestId)
      .single();
      
    if (!currentRequest) {
      console.error("La requête à mettre à jour n'existe pas");
      return undefined;
    }

    console.log("📋 Current data in database:", currentRequest.details);

    // Initialiser l'objet details à partir des données actuelles
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
    
    // Mettre à jour database si présent dans les updates - REMPLACER COMPLÈTEMENT les fileUrls
    if (updates.database) {
      const database = updates.database;
      console.log("Mise à jour de la database:", database);
      
      // Remplacer complètement au lieu de fusionner
      dbUpdates.details.database = {
        notes: database.notes || "",
        fileUrl: database.fileUrl || "",
        fileUrls: database.fileUrls || [], // Remplace complètement l'array
        webLinks: database.webLinks || []
      };
      
      console.log("Database mise à jour:", dbUpdates.details.database);
    }
    
    // Mettre à jour blacklist si présent dans les updates - REMPLACER COMPLÈTEMENT les fileUrls
    if (updates.blacklist) {
      const blacklist = updates.blacklist;
      console.log("Mise à jour de la blacklist:", blacklist);
      
      // Pour les comptes blacklist - remplacer complètement
      if (blacklist?.accounts) {
        dbUpdates.details.blacklist.accounts = {
          notes: blacklist.accounts.notes || "",
          fileUrl: blacklist.accounts.fileUrl || "",
          fileUrls: blacklist.accounts.fileUrls || [] // Remplace complètement l'array
        };
        console.log("Blacklist accounts mise à jour:", dbUpdates.details.blacklist.accounts);
      }
      
      // Pour les emails blacklist - remplacer complètement
      if (blacklist?.emails) {
        dbUpdates.details.blacklist.emails = {
          notes: blacklist.emails.notes || "",
          fileUrl: blacklist.emails.fileUrl || "",
          fileUrls: blacklist.emails.fileUrls || [] // Remplace complètement l'array
        };
        console.log("Blacklist emails mise à jour:", dbUpdates.details.blacklist.emails);
      }
    }
    
    // Toujours mettre à jour le timestamp last_updated
    dbUpdates.last_updated = new Date().toISOString();

    console.log("💾 Prepared data for update:", JSON.stringify(dbUpdates, null, 2));

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
