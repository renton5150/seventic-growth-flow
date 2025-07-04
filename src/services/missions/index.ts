
// Export all mission-related functions explicitly to avoid ambiguity
export {
  checkMissionExists,
  getAllSupaMissions,
  getSupaMissionsByUserId,
  getSupaMissionById,
  createSupaMission,
  updateSupaMission,
  mapSupaMissionToMission
} from "./utils";

// Export other modules
export * from "./getMissions";
export * from "./createMission";
export * from "./updateDeleteMission";

// Add the getMissions function that was missing
export { getAllSupaMissions as getMissions } from './utils';

// Export getMissionsByUserId for backward compatibility
export { getSupaMissionsByUserId as getMissionsByUserId } from './utils';

// Export the centralized mission name service
export * from '@/services/missionNameService';
