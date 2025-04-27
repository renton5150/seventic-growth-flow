
import {
  getAllMissionsFromSupabase,
  getMissionById,
  getMissionsByGrowthId,
  getMissionsBySdrId,
  getMissionsByUserId
} from "./operations/readMissions";
import { 
  createSupabaseMission,
  updateSupabaseMission,
  deleteSupabaseMission
} from './operations/writeMissions';
import { isMockDataEnabled } from '@/services/missions/mockMissions';
import { getAllMockMissions } from '@/services/missions/mockMissions';

// Aliases for backward compatibility
export const createMission = createSupabaseMission;
export const updateMission = updateSupabaseMission;
export const deleteMission = deleteSupabaseMission;

// Main function to get all missions, either from Supabase or mock data
export const getAllMissions = async () => {
  console.log("getAllMissions called, mock data enabled:", isMockDataEnabled);
  // Return mock data if flag is enabled
  if (isMockDataEnabled) {
    return await getAllMockMissions();
  }
  
  // Otherwise, get data from Supabase
  return await getAllMissionsFromSupabase();
};

// Main functions to be exported and used by the application
export {
  getMissionById,
  getMissionsBySdrId,
  getMissionsByGrowthId,
  getMissionsByUserId // Ensure backward compatibility
};
