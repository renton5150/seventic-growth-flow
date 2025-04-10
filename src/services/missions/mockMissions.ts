
import { v4 as uuidv4 } from "uuid";
import { missions as mockMissionsData } from "@/data/missions";
import { getUserById } from "@/data/users";
import { getRequestsByMissionId } from "@/data/requests";
import { Mission } from "@/types/types";
import { MissionInput } from "./types";

// Copie des missions mockées pour pouvoir les modifier
let missions = [...mockMissionsData];

// Obtenir toutes les missions
export const getAllMockMissions = async (): Promise<Mission[]> => {
  console.log("getAllMockMissions: Récupération de toutes les missions mockées");
  
  // Enrichir les missions avec les données associées
  const enrichedMissions = await Promise.all(
    missions.map(async (mission) => {
      // Obtenir le nom du SDR si disponible
      const sdrName = mission.sdrId ? (await getUserById(mission.sdrId))?.name || "" : "";
      
      // Obtenir les demandes associées
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        ...mission,
        sdrName,
        requests,
      };
    })
  );
  
  console.log("Nombre de missions mockées:", enrichedMissions.length);
  return enrichedMissions;
};

// Obtenir les missions par utilisateur
export const getMockMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  const userMissions = missions.filter((mission) => mission.sdrId === userId);
  
  // Enrichir les missions avec les données associées
  const enrichedMissions = await Promise.all(
    userMissions.map(async (mission) => {
      // Obtenir le nom du SDR
      const sdrName = mission.sdrId ? (await getUserById(mission.sdrId))?.name || "" : "";
      
      // Obtenir les demandes associées
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        ...mission,
        sdrName,
        requests,
      };
    })
  );
  
  return enrichedMissions;
};

// Obtenir une mission par ID
export const getMockMissionById = async (missionId: string): Promise<Mission | undefined> => {
  const mission = await findMockMissionById(missionId);
  if (!mission) return undefined;
  
  // Enrichir la mission avec les données associées
  const sdrName = mission.sdrId ? (await getUserById(mission.sdrId))?.name || "" : "";
  const requests = await getRequestsByMissionId(mission.id);
  
  return {
    ...mission,
    sdrName,
    requests,
  };
};

// Trouver une mission par ID (sans enrichissement)
export const findMockMissionById = async (missionId: string): Promise<Mission | undefined> => {
  return missions.find((mission) => mission.id === missionId);
};

// Créer une nouvelle mission
export const createMockMission = async (data: MissionInput): Promise<Mission> => {
  const id = uuidv4();
  
  const newMission: Mission = {
    id,
    name: data.name,
    client: data.client || "Nouveau client",
    description: data.description,
    sdrId: data.sdrId || "",
    createdAt: new Date(),
    startDate: data.startDate || new Date(),
    requests: []
  };
  
  // Ajouter le nom du SDR si disponible
  const sdrName = data.sdrId ? (await getUserById(data.sdrId))?.name || "" : "";
  
  // Ajouter la mission à la liste
  missions.push(newMission);
  
  return {
    ...newMission,
    sdrName,
  };
};

// Supprimer une mission
export const deleteMockMission = async (
  missionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("deleteMockMission: Suppression de la mission", missionId);
    
    // Vérifier si la mission existe
    const missionIndex = missions.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      console.warn("Mission non trouvée:", missionId);
      return { success: false, error: "Mission not found" };
    }
    
    // Supprimer la mission
    missions.splice(missionIndex, 1);
    console.log("Mission supprimée avec succès:", missionId);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la mission:", error);
    return { success: false, error: String(error) };
  }
};

// Assigner un SDR à une mission
export const assignSDRToMockMission = async (
  missionId: string,
  sdrId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Vérifier si la mission existe
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) {
      return { success: false, error: "Mission not found" };
    }
    
    // Mettre à jour l'ID du SDR
    mission.sdrId = sdrId;
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
