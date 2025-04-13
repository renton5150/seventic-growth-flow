
// Re-export all mock mission functionality from separate modules
import { v4 as uuidv4 } from "uuid";
import { Mission, MissionType } from "@/types/types";
import { getRequestsByMissionId } from "@/data/requests";
import { getMockUser } from "./mock/mockUsers";
import { mockMissions } from "./mock/mockData";
import { 
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  getMockMissionsBySdrId,
  findMockMissionById
} from "./mock/missionQueries";
import {
  createMockMission,
  deleteMockMission,
  updateMockMission
} from "./mock/missionMutations";

// Re-export everything for backward compatibility
export {
  getMockUser,
  mockMissions,
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  getMockMissionsBySdrId,
  findMockMissionById,
  createMockMission,
  deleteMockMission,
  updateMockMission
};
