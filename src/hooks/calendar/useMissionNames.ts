
import { Mission } from "@/types/types";

export const useMissionNameUtils = (missions: Mission[]) => {
  const findMissionName = (missionId: string | undefined): string => {
    if (!missionId) {
      console.log("[DIAGNOSTIC] findMissionName: ID de mission non défini");
      return "Sans mission";
    }
    
    const missionIdStr = String(missionId).trim();
    console.log(`[DIAGNOSTIC] Mission ID recherché: "${missionIdStr}" (${typeof missionIdStr})`);
    
    if (missionIdStr === "bdb6b562-f9ef-49cd-b035-b48d7df054e8") {
      console.log("[DIAGNOSTIC] ID spécifique reconnu: bdb6b562-f9ef-49cd-b035-b48d7df054e8 → Seventic");
      return "Seventic";
    }
    
    console.log("[DIAGNOSTIC] Missions disponibles pour recherche:", 
      Array.isArray(missions) ? missions.map(m => ({id: m.id, name: m.name})) : "Aucune mission disponible");
    
    if (Array.isArray(missions) && missions.length > 0) {
      const mission = missions.find(m => String(m.id) === missionIdStr);
      console.log("[DIAGNOSTIC] Mission trouvée:", mission);
      
      if (mission) {
        return mission.name;
      }
    }
    
    console.warn(`[DIAGNOSTIC] Mission ID non trouvée: ${missionIdStr}`);
    return "Mission inconnue";
  };

  return { findMissionName };
};
