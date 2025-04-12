
import { Mission, Request } from "@/types/types";
import { missions as mockMissions } from "@/data/missions";
import { v4 as uuidv4 } from "uuid";
import { getUserById } from "@/data/users";
import { getRequestsByMissionId } from "@/data/requests";

// In-memory missions storage - pour la simulation
let missionsData = [...mockMissions];

// Récupérer toutes les missions
export const getAllMockMissions = (): Mission[] => {
  return missionsData.map(mission => {
    const sdr = getUserById(mission.sdrId);
    return {
      ...mission,
      sdrName: sdr?.name || "Non assigné",
      requests: getRequestsByMissionId(mission.id)
    };
  });
};

// Récupérer une mission par ID
export const getMockMissionById = (id: string): Mission | undefined => {
  const mission = missionsData.find(m => m.id === id);
  if (!mission) return undefined;
  
  const sdr = getUserById(mission.sdrId);
  return {
    ...mission,
    sdrName: sdr?.name || "Non assigné",
    requests: getRequestsByMissionId(mission.id)
  };
};

// Récupérer les missions d'un utilisateur
export const getMockMissionsByUserId = (userId: string): Mission[] => {
  return missionsData
    .filter(mission => mission.sdrId === userId)
    .map(mission => {
      const sdr = getUserById(mission.sdrId);
      return {
        ...mission,
        sdrName: sdr?.name || "Non assigné",
        requests: getRequestsByMissionId(mission.id)
      };
    });
};

// Créer une nouvelle mission
export const createMockMission = (data: {
  name: string;
  client: string;
  sdrId: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Mission => {
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    client: data.client || "Client non spécifié",
    sdrId: data.sdrId,
    description: data.description,
    createdAt: new Date(),
    requests: [],
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    type: (data.type as "Full" | "Part") || "Full"
  };
  
  missionsData.push(newMission);
  
  const sdr = getUserById(newMission.sdrId);
  return {
    ...newMission,
    sdrName: sdr?.name || "Non assigné"
  };
};

// Trouver une mission par ID (utile pour les tests)
export const findMockMissionById = (id: string): Mission | undefined => {
  return missionsData.find(mission => mission.id === id);
};

// Supprimer une mission
export const deleteMockMission = (id: string): boolean => {
  const initialLength = missionsData.length;
  missionsData = missionsData.filter(mission => mission.id !== id);
  return missionsData.length !== initialLength;
};

// Alias pour la compatibilité
export const getMockMissionsBySdrId = getMockMissionsByUserId;
