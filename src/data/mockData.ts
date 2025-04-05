
import { AppData } from "../types/types";
import { users, getUserById, getCurrentUser } from "./users";
import { requests, getRequestsByMissionId, getRequestById } from "./requests";
import { missions, getMissionById, getMissionsBySdrId } from "./missions";

export const mockData: AppData = {
  users,
  missions,
  requests,
};

// Re-export all helper functions
export {
  getUserById,
  getCurrentUser,
  getMissionById,
  getMissionsBySdrId,
  getRequestsByMissionId,
  getRequestById,
};
