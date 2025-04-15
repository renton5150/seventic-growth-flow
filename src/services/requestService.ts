
// Export all request service functionality from the refactored modules
export * from './requests';

// Pour la compatibilité avec l'ancien code
import { Request } from "@/types/types";
import { getAllRequests as getAll, getRequestById as getById, createEmailCampaignRequest } from "./requests";
import { getMissionById } from "./missionService";

export const getAllRequests = async (): Promise<Request[]> => {
  const requests = await getAll();
  
  // Enrichir les requêtes avec les noms des missions
  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      if (request.missionId) {
        const mission = await getMissionById(request.missionId);
        return {
          ...request,
          missionName: mission?.name || null
        };
      }
      return request;
    })
  );
  
  return enrichedRequests;
};

export const getRequestById = getById;
export { createEmailCampaignRequest };
