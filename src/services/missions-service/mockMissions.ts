
import { Mission, MissionType } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";
import { getMockUser } from "@/services/missions/mockMissions";

/**
 * Get all mocked missions
 */
export const getMockedMissions = (): Mission[] => {
  // Import mockMissions dynamically to avoid circular reference issues
  const { mockMissions } = require('@/services/missions/mockMissions');
  return mockMissions;
};

/**
 * Get mocked missions by user ID
 */
export const getMockedUserMissions = (userId: string): Mission[] => {
  // Import mockMissions and filter functions dynamically
  const { getMockMissionsByUserId } = require('@/services/missions/mockMissions');
  return getMockMissionsByUserId(userId);
};

/**
 * Get mocked mission by ID
 */
export const getMockedMissionById = (missionId: string): Mission | undefined => {
  // Import mockMissions and find function dynamically
  const { findMockMissionById } = require('@/services/missions/mockMissions');
  return findMockMissionById(missionId);
};

/**
 * Create a mocked mission
 */
export const createMockedMission = (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Mission => {
  // Import createMockMission dynamically
  const { createMockMission } = require('@/services/missions/mockMissions');
  return createMockMission(data);
};

/**
 * Update a mocked mission
 */
export const updateMockedMission = async (data: {
  id: string;
  name: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  status?: "En cours" | "Fin";
}): Promise<Mission> => {
  // Import updateMockMission dynamically
  const { updateMockMission } = require('@/services/missions/mockMissions');
  return await updateMockMission(data);
};

/**
 * Delete a mocked mission
 */
export const deleteMockedMission = (missionId: string): boolean => {
  // Import deleteMockMission dynamically
  const { deleteMockMission } = require('@/services/missions/mockMissions');
  return deleteMockMission(missionId);
};
