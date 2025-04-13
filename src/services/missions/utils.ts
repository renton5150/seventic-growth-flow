import { Mission, MissionType } from "@/types/types";
import { getUserById } from "@/data/users";
import { getRequestsByMissionId } from "@/data/requests";

/**
 * Maps a mission record from Supabase to our Mission type
 */
export function mapSupaMissionToMission(mission: any): Mission {
  console.log("Données reçues de Supabase à mapper:", mission);
  
  // Check for sdr_id
  if (!mission.sdr_id) {
    console.warn("sdr_id manquant dans les données Supabase:", mission);
  }
  
  // Attempt to get SDR name from different possible sources
  let sdrName = "Non assigné";
  
  // If we have profiles data from a join
  if (mission.profiles) {
    sdrName = mission.profiles.name || "Non assigné";
  } else {
    // Fallback to get user from mock data
    const sdr = getUserById(mission.sdr_id);
    sdrName = sdr?.name || "Non assigné";
  }
  
  return {
    id: mission.id,
    name: mission.name,
    sdrId: mission.sdr_id,
    description: mission.description || "",
    createdAt: new Date(mission.created_at),
    sdrName: sdrName,
    requests: getRequestsByMissionId(mission.id),
    startDate: mission.start_date ? new Date(mission.start_date) : null,
    endDate: mission.end_date ? new Date(mission.end_date) : null,
    type: (mission.type as MissionType) || "Full",
    status: mission.status || "En cours"
  };
}
