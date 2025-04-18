
import { useMemo } from "react";
import { Mission } from "@/types/types";

export const useMissionNameUtils = (missions: Mission[]) => {
  // Create a memoized map for faster lookups with more fallback options
  const missionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add known mission IDs manually first (highest priority)
    map["bdb6b562-f9ef-49cd-b035-b48d7df054e8"] = "Seventic";
    map["124ea847-cf3f-44af-becb-75641ebf0ef1"] = "Datalit";
    map["f34e4f08-34c6-4419-b79e-83b6f519f8cf"] = "Sames";
    map["2180c854-4d88-4d53-88c3-f2efc9d251af"] = "HSBC";
    
    // Add missions from the mission array if available
    if (Array.isArray(missions)) {
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id).trim();
          // Use mission.name directly instead of trying to access client property
          map[missionId] = mission.name || "Mission sans nom";
        }
      });
    }
    
    console.log("[useMissionNameUtils] Mission name map created:", 
      Object.keys(map).length, "entries");
    
    return map;
  }, [missions]);

  const findMissionName = (missionId: string | undefined): string => {
    if (!missionId) {
      return "Sans mission";
    }
    
    const missionIdStr = String(missionId).trim();
    
    // Quick lookup from our memoized map
    if (missionNameMap[missionIdStr]) {
      return missionNameMap[missionIdStr];
    }
    
    // Check for specific known missions again as fallback
    if (missionIdStr === "bdb6b562-f9ef-49cd-b035-b48d7df054e8") {
      return "Seventic";
    }
    
    if (missionIdStr === "124ea847-cf3f-44af-becb-75641ebf0ef1") {
      return "Datalit";
    }

    if (missionIdStr === "f34e4f08-34c6-4419-b79e-83b6f519f8cf") {
      return "Sames";
    }

    if (missionIdStr === "2180c854-4d88-4d53-88c3-f2efc9d251af") {
      return "HSBC";
    }
    
    console.log(`[useMissionNameUtils] Mission ID not found in map: ${missionIdStr}`);
    return "Mission inconnue";
  };

  return { findMissionName, missionNameMap };
};
