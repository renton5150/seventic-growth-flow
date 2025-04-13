
import { Mission, MissionType, MissionStatus } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { mockMissions } from "./mockData";
import { getMockUser } from "./mockUsers";
import { getRequestsByMissionId } from "@/data/requests";

// Créer une nouvelle mission mockée
export const createMockMission = (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
  status?: MissionStatus;
}): Mission => {
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    sdrId: data.sdrId,
    description: data.description,
    createdAt: new Date(),
    sdrName: getMockUser(data.sdrId)?.name || "Non assigné",
    requests: [],
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    type: (data.type as MissionType) || "Full",
    status: data.status || "En cours"
  };
  
  console.log("Nouvelle mission créée avec statut:", newMission.status);
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
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  status?: MissionStatus;
}): Promise<Mission> => {
  console.log("Mise à jour de mission avec données:", data);
  console.log("Statut reçu pour mise à jour:", data.status);
  
  const missionIndex = mockMissions.findIndex(mission => mission.id === data.id);
  if (missionIndex === -1) {
    throw new Error(`Mission avec ID ${data.id} non trouvée`);
  }

  const sdr = getMockUser(data.sdrId);
  
  const updatedMission: Mission = {
    id: data.id,
    name: data.name,
    sdrId: data.sdrId,
    description: data.description || "",
    createdAt: mockMissions[missionIndex].createdAt,
    sdrName: sdr?.name || "Non assigné",
    requests: getRequestsByMissionId(data.id),
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.type as MissionType || "Full",
    status: data.status || mockMissions[missionIndex].status
  };
  
  console.log("Mission mise à jour avec statut:", updatedMission.status);
  mockMissions[missionIndex] = updatedMission;
  
  return updatedMission;
};
