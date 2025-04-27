
import { Mission, MissionType } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";

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
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    sdrId: data.sdrId,
    description: data.description || "",
    createdAt: new Date(),
    startDate: data.startDate || new Date(),
    endDate: data.endDate || null,
    type: (data.type as MissionType) || "Full",
    status: "En cours",
    requests: []
  };
  return newMission;
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
  const updatedMission: Mission = {
    id: data.id,
    name: data.name,
    sdrId: data.sdrId,
    description: data.description || "",
    createdAt: new Date(),
    startDate: data.startDate || new Date(),
    endDate: data.endDate,
    type: data.type as MissionType,
    status: data.status || "En cours",
    requests: []
  };
  return updatedMission;
};

/**
 * Delete a mocked mission
 */
export const deleteMockedMission = (missionId: string): boolean => {
  return true;
};
