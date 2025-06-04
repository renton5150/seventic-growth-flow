
import { useMemo, useCallback, useEffect } from "react";
import { Mission } from "@/types/types";
import { 
  getMissionName, 
  preloadMissionNames, 
  syncKnownMissions,
  refreshMissionNameCache
} from "@/services/missionNameService";

export const useMissionNameUtils = (missions: Mission[]) => {
  // Synchroniser les missions connues au montage du composant
  useEffect(() => {
    // Synchronisation des missions connues avec la base de données
    syncKnownMissions().then(() => {
      console.log("[useMissionNameUtils] Missions connues synchronisées");
    });
    
    // Rafraîchissement périodique du cache toutes les 5 minutes
    const refreshInterval = setInterval(() => {
      refreshMissionNameCache();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Create a memoized map for faster lookups with consistent naming convention
  const missionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    console.log("[useMissionNameUtils] Creating mission name map with", missions?.length || 0, "missions");
    
    // Add missions from the mission array if available
    if (Array.isArray(missions)) {
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id).trim();
          
          // Use the mission.name which should already be standardized by mapSupaMissionToMission
          // This avoids an extra call to getMissionName
          if (mission.name) {
            map[missionId] = mission.name;
            console.log(`[useMissionNameUtils] Using provided mission name for ${missionId}: "${mission.name}"`);
          }
        }
      });
    }
    
    console.log("[useMissionNameUtils] Mission name map created with", 
      Object.keys(map).length, "entries");
    
    return map;
  }, [missions]);

  // Preload mission names when missions change
  useEffect(() => {
    if (Array.isArray(missions) && missions.length > 0) {
      const missionIds = missions
        .map(m => m?.id)
        .filter((id): id is string => !!id);
        
      if (missionIds.length > 0) {
        preloadMissionNames(missionIds);
      }
    }
  }, [missions]);

  // This function has to be async to match the implementation in missionNameService
  const findMissionName = useCallback(async (missionId: string | undefined): Promise<string> => {
    if (!missionId) {
      return "Sans mission";
    }
    
    const missionIdStr = String(missionId).trim();
    
    // Quick lookup from our memoized map first
    if (missionNameMap[missionIdStr]) {
      return missionNameMap[missionIdStr];
    }
    
    // If not in memoized map, use the centralized service
    return getMissionName(missionIdStr);
  }, [missionNameMap]);

  return { findMissionName, missionNameMap };
};
