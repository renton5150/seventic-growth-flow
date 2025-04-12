
import { Mission } from "@/types/types";
import { checkMissionExists } from "@/services/missions";
import {
  getMockedMissions,
  getMockedUserMissions,
  getMockedMissionById,
  createMockedMission,
  updateMockedMission,
  deleteMockedMission
} from "./mockMissions";
import {
  getSupabaseMissions,
  getSupabaseUserMissions,
  getSupabaseMissionById,
  createSupabaseMission,
  updateSupabaseMission,
  deleteSupabaseMission,
  isSupabaseAuthenticated
} from "./supabaseMissions";

// Re-export the check mission exists function for backward compatibility
export { checkMissionExists } from "@/services/missions";

/**
 * Gets all missions with fallback to mock data
 */
export const getAllMissions = async (): Promise<Mission[]> => {
  console.log("Getting all missions");
  
  const supaMissions = await getSupabaseMissions();
  if (supaMissions.length > 0) {
    console.log(`Retrieved ${supaMissions.length} missions from Supabase`);
    return supaMissions;
  }
  
  console.log("Falling back to mock mission data");
  return getMockedMissions();
};

/**
 * Gets missions by user ID with fallback to mock data
 */
export const getMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  console.log(`Getting missions for user ${userId}`);
  
  const supaMissions = await getSupabaseUserMissions(userId);
  if (supaMissions.length > 0) {
    console.log(`Retrieved ${supaMissions.length} missions for user from Supabase`);
    return supaMissions;
  }
  
  console.log("Falling back to mock mission data for user");
  return getMockedUserMissions(userId);
};

/**
 * Gets a mission by ID with fallback to mock data
 */
export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  console.log(`Getting mission with ID ${missionId}`);
  
  const supaMission = await getSupabaseMissionById(missionId);
  if (supaMission) {
    console.log("Retrieved mission from Supabase");
    return supaMission;
  }
  
  console.log("Falling back to mock mission data for ID");
  return getMockedMissionById(missionId);
};

/**
 * Creates a new mission with fallback to mock data
 */
export const createMission = async (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Promise<Mission | undefined> => {
  console.log("Creating new mission:", data);
  
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    if (isAuthenticated) {
      console.log("Attempting to create mission in Supabase");
      return await createSupabaseMission(data);
    }
  } catch (error) {
    console.error("Error creating mission in Supabase:", error);
    console.log("Falling back to mock mission creation");
  }
  
  return createMockedMission(data);
};

/**
 * Updates an existing mission with fallback to mock data
 */
export const updateMission = async (data: {
  id: string;
  name: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
}): Promise<Mission | undefined> => {
  console.log("Updating mission:", data);
  
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    if (isAuthenticated) {
      console.log("Attempting to update mission in Supabase");
      return await updateSupabaseMission(data);
    }
  } catch (error) {
    console.error("Error updating mission in Supabase:", error);
    console.log("Falling back to mock mission update");
  }
  
  return updateMockedMission(data);
};

/**
 * Deletes a mission by ID with fallback to mock data
 */
export const deleteMission = async (missionId: string): Promise<boolean> => {
  console.log(`Deleting mission with ID ${missionId}`);
  
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    if (isAuthenticated) {
      console.log("Attempting to delete mission from Supabase");
      return await deleteSupabaseMission(missionId);
    }
  } catch (error) {
    console.error("Error deleting mission from Supabase:", error);
    console.log("Falling back to mock mission deletion");
  }
  
  return deleteMockedMission(missionId);
};
