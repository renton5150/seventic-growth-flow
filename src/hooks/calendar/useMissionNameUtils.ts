
import { useMemo } from "react";
import { Mission } from "@/types/types";

export const useMissionNameUtils = (missions: Mission[]) => {
  // Create a memoized map for faster lookups with consistent naming convention
  const missionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    console.log("[useMissionNameUtils] Creating mission name map with", missions?.length || 0, "missions");
    
    // Add missions from the mission array if available
    if (Array.isArray(missions)) {
      missions.forEach(mission => {
        if (mission && mission.id) {
          const missionId = String(mission.id).trim();
          
          // CRITICAL: Use EXACT SAME priority logic as formatRequestFromDb
          // PRIORITÉ : client > name > id court
          let missionName = "Sans mission";
          
          if (mission.client && mission.client.trim() !== "" && 
              mission.client !== "null" && mission.client !== "undefined") {
            missionName = mission.client;
            console.log(`[useMissionNameUtils] PRIORITY #1: Using client for ${missionId}: "${missionName}"`);
          }
          else if (mission.name && mission.name.trim() !== "" && 
                  mission.name !== "null" && mission.name !== "undefined") {
            missionName = mission.name;
            console.log(`[useMissionNameUtils] PRIORITY #2: Using name for ${missionId}: "${missionName}"`);
          }
          else {
            missionName = `Mission ${missionId.substring(0, 8)}`;
            console.log(`[useMissionNameUtils] PRIORITY #3: Using short ID for ${missionId}: "${missionName}"`);
          }
            
          map[missionId] = missionName;
        }
      });
    }
    
    // Add known mission IDs manually as fallback (if not already in the map)
    const knownMissions = {
      "bdb6b562-f9ef-49cd-b035-b48d7df054e8": "Seventic",
      "124ea847-cf3f-44af-becb-75641ebf0ef1": "Datalit",
      "f34e4f08-34c6-4419-b79e-83b6f519f8cf": "Sames",
      "2180c854-4d88-4d53-88c3-f2efc9d251af": "HSBC",
      "2f042e2b-d591-4b5f-b73d-c5050d53874d": "Capensis",
      "c033b7b7-9fd1-4970-8834-b5c2bdde12b7": "DFIN",
      "250d09ae-44b8-4296-a7df-6d9a56269a3": "Axialys",
      "41a43fba-74e3-46e2-a6a9-6ebeb2d1e5ea": "Eiffage"
    };
    
    Object.entries(knownMissions).forEach(([id, name]) => {
      if (!map[id]) {
        map[id] = name;
        console.log(`[useMissionNameUtils] Added known mission fallback: ${id} => ${name}`);
      }
    });
    
    console.log("[useMissionNameUtils] Mission name map created with", 
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
    
    // If not found in map, try manual check against known IDs
    const knownMissions: Record<string, string> = {
      "bdb6b562-f9ef-49cd-b035-b48d7df054e8": "Seventic",
      "124ea847-cf3f-44af-becb-75641ebf0ef1": "Datalit",
      "f34e4f08-34c6-4419-b79e-83b6f519f8cf": "Sames",
      "2180c854-4d88-4d53-88c3-f2efc9d251af": "HSBC",
      "2f042e2b-d591-4b5f-b73d-c5050d53874d": "Capensis",
      "c033b7b7-9fd1-4970-8834-b5c2bdde12b7": "DFIN",
      "250d09ae-44b8-4296-a7df-6d9a56269a3": "Axialys",
      "41a43fba-74e3-46e2-a6a9-6ebeb2d1e5ea": "Eiffage"
    };
    
    if (knownMissions[missionIdStr]) {
      console.log(`[useMissionNameUtils] Mission found in known list: ${missionIdStr} => ${knownMissions[missionIdStr]}`);
      return knownMissions[missionIdStr];
    }
    
    // Last resort - generate a name from the ID
    console.log(`[useMissionNameUtils] Mission not found in map: ${missionIdStr} => using short ID`);
    
    return `Mission ${missionIdStr.substring(0, 8)}`;
  };

  return { findMissionName, missionNameMap };
};
