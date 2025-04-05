import { v4 as uuidv4 } from 'uuid';
import { mockData } from "@/data/mockData";
import { Request, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";

// Ajouter une requête à la liste des requêtes
export const addRequest = (request: Partial<Request>): Request => {
  const currentDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Par défaut, date d'échéance à 7 jours

  const newRequest = {
    id: uuidv4(),
    createdAt: currentDate,
    lastUpdated: currentDate,
    dueDate: request.dueDate || dueDate,
    status: 'pending',
    isLate: false,
    ...request
  } as Request;

  mockData.requests.push(newRequest);
  return newRequest;
};

// Get a request by its ID
export const getRequestById = (id: string): Request | null => {
  const request = mockData.requests.find(req => req.id === id);
  return request || null;
};

// Créer une demande d'email
export const createEmailCampaignRequest = (data: any): EmailCampaignRequest => {
  const emailRequest: Partial<EmailCampaignRequest> = {
    type: "email",
    title: data.title,
    missionId: data.missionId,
    createdBy: data.createdBy,
    template: {
      content: data.template?.content,
      fileUrl: data.template?.fileUrl,
      webLink: data.template?.webLink
    },
    database: {
      fileUrl: data.database?.fileUrl,
      webLink: data.database?.webLink,
      notes: data.database?.notes
    },
    blacklist: {
      accounts: {
        fileUrl: data.blacklist?.accounts?.fileUrl,
        notes: data.blacklist?.accounts?.notes
      },
      emails: {
        fileUrl: data.blacklist?.emails?.fileUrl,
        notes: data.blacklist?.emails?.notes
      }
    },
    dueDate: data.dueDate
  };
  
  return addRequest(emailRequest) as EmailCampaignRequest;
};

// Créer une demande de base de données
export const createDatabaseRequest = (data: any): DatabaseRequest => {
  const databaseRequest: Partial<DatabaseRequest> = {
    type: "database",
    title: data.title,
    missionId: data.missionId,
    createdBy: data.createdBy,
    tool: data.tool,
    targeting: {
      jobTitles: data.targeting?.jobTitles,
      industries: data.targeting?.industries,
      companySize: data.targeting?.companySize,
      otherCriteria: data.targeting?.otherCriteria
    },
    blacklist: {
      accounts: {
        fileUrl: data.blacklist?.accounts?.fileUrl,
        notes: data.blacklist?.accounts?.notes
      },
      contacts: {
        fileUrl: data.blacklist?.contacts?.fileUrl,
        notes: data.blacklist?.contacts?.notes
      }
    },
    dueDate: data.dueDate
  };
  
  return addRequest(databaseRequest) as DatabaseRequest;
};

// Créer une demande de scrapping LinkedIn
export const createLinkedInScrapingRequest = (data: any): LinkedInScrapingRequest => {
  const linkedInRequest: Partial<LinkedInScrapingRequest> = {
    type: "linkedin",
    title: data.title,
    missionId: data.missionId,
    createdBy: data.createdBy,
    targeting: {
      jobTitles: data.targeting?.jobTitles,
      locations: data.targeting?.locations,
      industries: data.targeting?.industries,
      companySize: data.targeting?.companySize,
      otherCriteria: data.targeting?.otherCriteria
    },
    dueDate: data.dueDate
  };
  
  return addRequest(linkedInRequest) as LinkedInScrapingRequest;
};

// Obtenir toutes les requêtes
export const getAllRequests = (): Request[] => {
  return mockData.requests;
};

// Update request status (for Growth team)
export const updateRequestStatus = (
  id: string, 
  status: 'pending' | 'inprogress' | 'completed', 
  data?: any
): Request | null => {
  const requestIndex = mockData.requests.findIndex(req => req.id === id);
  
  if (requestIndex === -1) return null;
  
  const request = mockData.requests[requestIndex];
  
  // Update the request
  mockData.requests[requestIndex] = {
    ...request,
    status,
    lastUpdated: new Date(),
    ...data
  };
  
  return mockData.requests[requestIndex];
};
