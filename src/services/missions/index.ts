
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
export const getMissions = getAllSupaMissions;
