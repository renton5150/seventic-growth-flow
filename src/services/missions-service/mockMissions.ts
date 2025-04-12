
import { Mission, MissionType } from "@/types/types";
import {
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  createMockMission,
  findMockMissionById,
  deleteMockMission,
  updateMockMission
} from "@/services/missions/mockMissions";

// Re-export mock helper functions for backward compatibility
export { findMockMissionById, getMockMissionsBySdrId } from "@/services/missions/mockMissions";

/**
 * Gets all mock missions
 */
export const getMockedMissions = async (): Promise<Mission[]> => {
  return getAllMockMissions();
};

/**
 * Gets a user's mock missions
 */
export const getMockedUserMissions = async (userId: string): Promise<Mission[]> => {
  return getMockMissionsByUserId(userId);
};

/**
 * Gets a mock mission by ID
 */
export const getMockedMissionById = async (missionId: string): Promise<Mission | undefined> => {
  return getMockMissionById(missionId);
};

/**
 * Creates a mock mission
 */
export const createMockedMission = async (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Promise<Mission | undefined> => {
  // Ensure type is a valid MissionType
  const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
  
  return createMockMission({
    ...data,
    type: missionType
  });
};

/**
 * Updates a mock mission
 */
export const updateMockedMission = async (data: {
  id: string;
  name: string;
  client?: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
}): Promise<Mission | undefined> => {
  // Ensure type is a valid MissionType
  const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
  
  return updateMockMission({
    ...data,
    type: missionType
  });
};

/**
 * Deletes a mock mission
 */
export const deleteMockedMission = async (missionId: string): Promise<boolean> => {
  return deleteMockMission(missionId);
};
