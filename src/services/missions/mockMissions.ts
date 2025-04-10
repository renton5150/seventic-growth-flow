
import { Mission, Request } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { missions as mockMissions } from "@/data/missions";
import { getUserById } from "@/data/users";
import { getRequestsByMissionId as getMockRequestsByMissionId } from "@/data/requests";

// Variable locale pour stocker les missions mockées
let missions = [...mockMissions];

// Obtenir toutes les missions mockées
export const getAllMockMissions = async (): Promise<Mission[]> => {
  return missions.map(mission => {
    const sdr = getUserById(mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Inconnu",
      requests: getMockRequestsByMissionId(mission.id)
    };
  });
};

// Obtenir les missions mockées par ID d'utilisateur
export const getMockMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  return getMockMissionsBySdrId(userId);
};

// Exporté pour compatibilité avec du code existant
export const getMockMissionsBySdrId = (sdrId: string): Mission[] => {
  const filteredMissions = missions.filter((mission) => mission.sdrId === sdrId);
  
  return filteredMissions.map(mission => {
    const sdr = getUserById(mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Inconnu",
      requests: getMockRequestsByMissionId(mission.id)
    };
  });
};

// Obtenir une mission mockée par ID
export const getMockMissionById = async (id: string): Promise<Mission | undefined> => {
  return findMockMissionById(id);
};

// Fonction helper exportée pour compatibilité avec du code existant
export const findMockMissionById = (id: string): Mission | undefined => {
  const mission = missions.find((mission) => mission.id === id);
  
  if (!mission) return undefined;
  
  const sdr = getUserById(mission.sdrId);
  
  return {
    ...mission,
    sdrName: sdr?.name || "Inconnu",
    requests: getMockRequestsByMissionId(mission.id)
  };
};

// Créer une nouvelle mission mockée
export const createMockMission = async (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate: Date;
}): Promise<Mission> => {
  const now = new Date();
  const id = uuidv4();
  
  const newMission: Mission = {
    id,
    name: data.name,
    client: "Default Client",
    description: data.description,
    sdrId: data.sdrId,
    createdAt: now,
    startDate: data.startDate || now,
    requests: []
  };
  
  // Ajouter à notre tableau local
  missions.push(newMission);
  
  const sdr = getUserById(data.sdrId);
  
  return {
    ...newMission,
    sdrName: sdr?.name || "Inconnu",
  };
};

// Supprimer une mission mockée
export const deleteMockMission = async (id: string): Promise<boolean> => {
  const initialLength = missions.length;
  missions = missions.filter(mission => mission.id !== id);
  
  return missions.length !== initialLength;
};

// Assigner un SDR à une mission mockée
export const assignSDRToMockMission = async (missionId: string, sdrId: string): Promise<boolean> => {
  const missionIndex = missions.findIndex(mission => mission.id === missionId);
  
  if (missionIndex === -1) {
    return false;
  }
  
  missions[missionIndex] = {
    ...missions[missionIndex],
    sdrId
  };
  
  return true;
};
