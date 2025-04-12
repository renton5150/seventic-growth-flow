import { Mission, MissionType } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";
import { getMockUser } from "@/data/users";
import { mockMissions } from "@/data/missions";

// Obtenir toutes les missions mockées
export const getAllMockMissions = (): Mission[] => {
  return mockMissions;
};

// Obtenir les missions mockées par utilisateur
export const getMockMissionsByUserId = (userId: string): Mission[] => {
  return mockMissions.filter(mission => mission.sdrId === userId);
};

// Obtenir une mission mockée par ID
export const getMockMissionById = (missionId: string): Mission | undefined => {
  return mockMissions.find(mission => mission.id === missionId);
};

// Obtenir les missions mockées par SDR ID
export const getMockMissionsBySdrId = (sdrId: string): Mission[] => {
    return mockMissions.filter(mission => mission.sdrId === sdrId);
};

// Trouver une mission mockée par ID
export const findMockMissionById = (missionId: string): Mission | undefined => {
  return mockMissions.find(mission => mission.id === missionId);
};

// Créer une nouvelle mission mockée
export const createMockMission = (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Mission => {
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    client: data.client,
    sdrId: data.sdrId,
    description: data.description,
    createdAt: new Date(),
    sdrName: getMockUser(data.sdrId)?.name || "Non assigné",
    requests: [],
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.type as MissionType || "Full"
  };
  mockMissions.push(newMission);
  return newMission;
};

// Supprimer une mission mockée
export const deleteMockMission = (missionId: string): boolean => {
  const index = mockMissions.findIndex(mission => mission.id === missionId);
  if (index !== -1) {
    mockMissions.splice(index, 1);
    return true;
  }
  return false;
};

// Mettre à jour une mission mockée
export const updateMockMission = async (data: {
  id: string;
  name: string;
  client?: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
}): Promise<Mission> => {
  // Chercher la mission à mettre à jour
  const missionIndex = mockMissions.findIndex(mission => mission.id === data.id);
  if (missionIndex === -1) {
    throw new Error(`Mission avec ID ${data.id} non trouvée`);
  }

  // Obtenir des informations sur le SDR
  const sdr = getMockUser(data.sdrId);
  
  // Créer un objet mission mis à jour
  const updatedMission: Mission = {
    id: data.id,
    name: data.name,
    client: data.client || "",
    sdrId: data.sdrId,
    description: data.description || "",
    createdAt: mockMissions[missionIndex].createdAt,
    sdrName: sdr?.name || "Non assigné",
    requests: getRequestsByMissionId(data.id),
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.type as MissionType || "Full"
  };
  
  // Mettre à jour la mission dans le tableau mockée
  mockMissions[missionIndex] = updatedMission;
  
  return updatedMission;
};
