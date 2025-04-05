
import { Request, RequestStatus, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { supabase } from "@/lib/supabase";

// Obtenir toutes les requêtes
export const getAllRequests = async (): Promise<Request[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des requêtes:", error);
      return [];
    }

    // Adapter les données au format attendu par l'application
    return requests.map(request => formatRequestFromDb(request));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des requêtes:", error);
    return [];
  }
};

// Obtenir une requête par ID
export const getRequestById = async (requestId: string): Promise<Request | undefined> => {
  try {
    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de la requête:", error);
      return undefined;
    }

    return formatRequestFromDb(request);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la requête:", error);
    return undefined;
  }
};

// Obtenir les requêtes par mission
export const getRequestsByMissionId = async (missionId: string): Promise<Request[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('missionId', missionId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des requêtes pour la mission ${missionId}:`, error);
      return [];
    }

    return requests.map(request => formatRequestFromDb(request));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des requêtes par mission:", error);
    return [];
  }
};

// Mettre à jour le statut d'une requête
export const updateRequestStatus = async (requestId: string, status: RequestStatus, additionalData = {}): Promise<Request | undefined> => {
  try {
    const { data: request, error: getError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (getError) {
      console.error("Erreur lors de la récupération de la requête pour mise à jour:", getError);
      return undefined;
    }

    const updateData = {
      ...request,
      ...additionalData,
      status,
      lastUpdated: new Date().toISOString()
    };

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour du statut de la requête:", updateError);
      return undefined;
    }

    return formatRequestFromDb(updatedRequest);
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour du statut de la requête:", error);
    return undefined;
  }
};

// Mettre à jour une requête
export const updateRequest = async (requestId: string, updates: Partial<Request>): Promise<Request | undefined> => {
  try {
    // Récupérer la requête actuelle
    const { data: currentRequest, error: getError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (getError) {
      console.error("Erreur lors de la récupération de la requête pour mise à jour:", getError);
      return undefined;
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    // Mettre à jour la requête
    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour de la requête:", updateError);
      return undefined;
    }

    return formatRequestFromDb(updatedRequest);
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la requête:", error);
    return undefined;
  }
};

// Créer une requête de campagne email
export const createEmailCampaignRequest = async (requestData: any): Promise<EmailCampaignRequest | undefined> => {
  try {
    const dbRequest = {
      type: "email",
      title: requestData.title,
      missionId: requestData.missionId,
      createdBy: requestData.createdBy,
      createdAt: new Date().toISOString(),
      status: "pending" as RequestStatus,
      dueDate: requestData.dueDate.toISOString(),
      lastUpdated: new Date().toISOString(),
      template: requestData.template,
      database: requestData.database,
      blacklist: requestData.blacklist
    };

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert(dbRequest)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la requête de campagne email:", error);
      return undefined;
    }

    return formatRequestFromDb(newRequest) as EmailCampaignRequest;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la requête de campagne email:", error);
    return undefined;
  }
};

// Créer une requête de base de données
export const createDatabaseRequest = async (requestData: any): Promise<DatabaseRequest | undefined> => {
  try {
    const dbRequest = {
      type: "database",
      title: requestData.title,
      missionId: requestData.missionId,
      createdBy: requestData.createdBy,
      createdAt: new Date().toISOString(),
      status: "pending" as RequestStatus,
      dueDate: requestData.dueDate.toISOString(),
      lastUpdated: new Date().toISOString(),
      tool: requestData.tool,
      targeting: requestData.targeting,
      blacklist: requestData.blacklist
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

// Créer une requête de scraping LinkedIn
export const createLinkedInScrapingRequest = async (requestData: any): Promise<LinkedInScrapingRequest | undefined> => {
  try {
    const dbRequest = {
      type: "linkedin",
      title: requestData.title,
      missionId: requestData.missionId,
      createdBy: requestData.createdBy,
      createdAt: new Date().toISOString(),
      status: "pending" as RequestStatus,
      dueDate: requestData.dueDate.toISOString(),
      lastUpdated: new Date().toISOString(),
      targeting: requestData.targeting
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

// Fonction utilitaire pour formater une requête depuis la base de données
const formatRequestFromDb = (dbRequest: any): Request => {
  const baseRequest = {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.missionId,
    createdBy: dbRequest.createdBy,
    createdAt: new Date(dbRequest.createdAt),
    status: dbRequest.status as RequestStatus,
    dueDate: new Date(dbRequest.dueDate),
    lastUpdated: new Date(dbRequest.lastUpdated),
    isLate: new Date(dbRequest.dueDate) < new Date() && dbRequest.status !== "completed",
    sdrName: dbRequest.sdrName
  };

  switch (dbRequest.type) {
    case "email":
      return {
        ...baseRequest,
        type: "email",
        template: dbRequest.template || {},
        database: dbRequest.database || {},
        blacklist: dbRequest.blacklist || {},
        platform: dbRequest.platform,
        statistics: dbRequest.statistics
      } as EmailCampaignRequest;
    case "database":
      return {
        ...baseRequest,
        type: "database",
        tool: dbRequest.tool,
        targeting: dbRequest.targeting || {},
        blacklist: dbRequest.blacklist || {},
        contactsCreated: dbRequest.contactsCreated
      } as DatabaseRequest;
    case "linkedin":
      return {
        ...baseRequest,
        type: "linkedin",
        targeting: dbRequest.targeting || {},
        profilesScraped: dbRequest.profilesScraped,
        resultFileUrl: dbRequest.resultFileUrl
      } as LinkedInScrapingRequest;
    default:
      return baseRequest as Request;
  }
};
