
import { v4 as uuidv4 } from 'uuid';
import { mockData } from "@/data/mockData";
import { Request, RequestStatus, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { getUserById } from "@/data/users";

// Get all requests
export const getAllRequests = (): Request[] => {
  return mockData.requests;
};

// Get request by ID
export const getRequestById = (requestId: string): Request | undefined => {
  return mockData.requests.find(request => request.id === requestId);
};

// Get requests by mission ID
export const getRequestsByMissionId = (missionId: string): Request[] => {
  return mockData.requests.filter(request => request.missionId === missionId);
};

// Update request status
export const updateRequestStatus = (requestId: string, status: RequestStatus, additionalData = {}): Request | undefined => {
  const requestIndex = mockData.requests.findIndex(request => request.id === requestId);
  
  if (requestIndex === -1) return undefined;
  
  const updatedRequest = {
    ...mockData.requests[requestIndex],
    status,
    lastUpdated: new Date(),
    ...additionalData
  };
  
  mockData.requests[requestIndex] = updatedRequest;
  
  return updatedRequest;
};

// Update request (for editing title, date, etc.)
export const updateRequest = (requestId: string, updates: Partial<Request>): Request | undefined => {
  const requestIndex = mockData.requests.findIndex(request => request.id === requestId);
  
  if (requestIndex === -1) return undefined;
  
  const updatedRequest = {
    ...mockData.requests[requestIndex],
    ...updates,
    lastUpdated: new Date()
  };
  
  mockData.requests[requestIndex] = updatedRequest;
  
  return updatedRequest;
};

// Create a new request
export const createRequest = (request: Omit<Request, 'id' | 'lastUpdated'>): Request => {
  const newRequest = {
    ...request,
    id: uuidv4(),
    lastUpdated: new Date()
  };
  
  mockData.requests.push(newRequest as Request);
  
  return newRequest as Request;
};

// Create a new email campaign request
export const createEmailCampaignRequest = (requestData: any): EmailCampaignRequest => {
  const newRequest: EmailCampaignRequest = {
    id: uuidv4(),
    type: "email",
    title: requestData.title,
    missionId: requestData.missionId,
    createdBy: requestData.createdBy,
    createdAt: new Date(),
    status: "pending" as RequestStatus,
    dueDate: requestData.dueDate,
    lastUpdated: new Date(),
    template: requestData.template,
    database: requestData.database,
    blacklist: requestData.blacklist,
  };
  
  mockData.requests.push(newRequest);
  
  return newRequest;
};

// Create a new database request
export const createDatabaseRequest = (requestData: any): DatabaseRequest => {
  const newRequest: DatabaseRequest = {
    id: uuidv4(),
    type: "database",
    title: requestData.title,
    missionId: requestData.missionId,
    createdBy: requestData.createdBy,
    createdAt: new Date(),
    status: "pending" as RequestStatus,
    dueDate: requestData.dueDate,
    lastUpdated: new Date(),
    tool: requestData.tool,
    targeting: requestData.targeting,
    blacklist: requestData.blacklist,
  };
  
  mockData.requests.push(newRequest);
  
  return newRequest;
};

// Create a new LinkedIn scraping request
export const createLinkedInScrapingRequest = (requestData: any): LinkedInScrapingRequest => {
  const newRequest: LinkedInScrapingRequest = {
    id: uuidv4(),
    type: "linkedin",
    title: requestData.title,
    missionId: requestData.missionId,
    createdBy: requestData.createdBy,
    createdAt: new Date(),
    status: "pending" as RequestStatus,
    dueDate: requestData.dueDate,
    lastUpdated: new Date(),
    targeting: requestData.targeting,
  };
  
  mockData.requests.push(newRequest);
  
  return newRequest;
};
