
import { useMemo } from "react";
import { Mission } from "@/types/types";

export const useMissionNameUtils = (missions: Mission[]) => {
  // Create a memoized map for faster lookups
  const missionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    if (Array.isArray(missions)) {
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id).trim();
          map[missionId] = mission.name;
        }
      });
      
      // Add known mission IDs manually for fallback
      map["bdb6b562-f9ef-49cd-b035-b48d7df054e8"] = "Seventic";
      map["124ea847-cf3f-44af-becb-75641ebf0ef1"] = "Datalit";
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
    
    // Special cases
    if (missionIdStr === "bdb6b562-f9ef-49cd-b035-b48d7df054e8") {
      return "Seventic";
    }
    
    if (missionIdStr === "124ea847-cf3f-44af-becb-75641ebf0ef1") {
      return "Datalit";
    }
    
    console.log(`[useMissionNameUtils] Mission ID not found in map: ${missionIdStr}`);
    return "Mission inconnue";
  };

  return { findMissionName, missionNameMap };
};
