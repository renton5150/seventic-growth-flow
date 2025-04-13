
import { Mission } from "@/types/types";
import { mockMissions } from "./mockData";

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
