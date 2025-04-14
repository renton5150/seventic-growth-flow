import { Mission, MissionType } from "@/types/types";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";
import { getMockUser } from "./mockMissions";

// Mock users for testing
const mockUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Robert Brown" },
];

// Helper function to get a mock user by ID
export const getMockUser = (id: string) => {
  return mockUsers.find(user => user.id === id) || { name: "Non assigné" };
};

// Mock missions data
export const mockMissions: Mission[] = [
  {
    id: "mission1",
    name: "Prospection LinkedIn",
    sdrId: "user1",
    description: "Campagne de prospection sur LinkedIn",
    createdAt: new Date("2023-01-15"),
    sdrName: "John Doe",
    requests: [],
    startDate: new Date("2023-02-01"),
    endDate: new Date("2023-03-15"),
    type: "Full" as MissionType,
    status: "En cours"
  },
  {
    id: "mission2",
    name: "Emailing Secteur Finance",
    sdrId: "user2",
    description: "Campagne d'emailing ciblée",
    createdAt: new Date("2023-02-20"),
    sdrName: "Jane Smith",
    requests: [],
    startDate: new Date("2023-03-01"),
    endDate: null,
    type: "Part" as MissionType,
    status: "En cours"
  }
];

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
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
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
    status: "En cours"
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
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  status?: "En cours" | "Fin";
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
    sdrId: data.sdrId,
    description: data.description || "",
    createdAt: mockMissions[missionIndex].createdAt,
    sdrName: sdr?.name || "Non assigné",
    requests: getRequestsByMissionId(data.id),
    startDate: data.startDate,
    endDate: data.endDate,
    type: data.type as MissionType || "Full",
    status: data.status || "En cours"
  };
  
  // Mettre à jour la mission dans le tableau mockée
  mockMissions[missionIndex] = updatedMission;
  
  return updatedMission;
};
