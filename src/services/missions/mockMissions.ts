
import { Mission, Request } from "@/types/types";
import { getRequestsByMissionId } from "../requestService";
import { mockData } from "@/data/mockData";

// Fonctions pour les données mockées
export const getMockMissionById = (missionId: string): Mission | undefined => {
  const mission = mockData.missions.find((mission) => mission.id === missionId);
  if (!mission) return undefined;
  
  return {
    ...mission,
    sdrName: mission.sdrId === "user2" ? "Sales Representative" : "Utilisateur inconnu",
  };
};

export const getMockMissionsBySdrId = (sdrId: string): Mission[] => {
  return mockData.missions
    .filter((mission) => mission.sdrId === sdrId)
    .map(mission => ({
      ...mission,
      sdrName: mission.sdrId === "user2" ? "Sales Representative" : "Utilisateur inconnu",
    }));
};

// Obtenir toutes les missions mockées
export const getAllMockMissions = async (): Promise<Mission[]> => {
  console.log("Utilisation des données mockées pour les missions");
  return Promise.all(mockData.missions.map(async mission => {
    const requests = await getRequestsByMissionId(mission.id);
    return {
      ...mission,
      sdrName: mission.sdrId === "user2" ? "Sales Representative" : "Utilisateur inconnu",
      requests
    };
  }));
};

// Obtenir les missions mockées par utilisateur
export const getMockMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  console.log("Utilisation des données mockées pour les missions d'un utilisateur");
  return Promise.all(getMockMissionsBySdrId(userId).map(async mission => {
    const requests = await getRequestsByMissionId(mission.id);
    return {
      ...mission,
      requests
    };
  }));
};

// Obtenir une mission mockée par ID
export const getMockMissionById = async (missionId: string): Promise<Mission | undefined> => {
  console.log("Utilisation des données mockées pour une mission par ID");
  const mission = getMockMissionById(missionId);
  if (!mission) return undefined;
  
  const requests = await getRequestsByMissionId(mission.id);
  return {
    ...mission,
    requests
  };
};

// Créer une nouvelle mission mockée
export const createMockMission = async (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
}): Promise<Mission | undefined> => {
  console.log("Mode démo: simulation de création de mission");
  // En mode démo, on ajoute simplement à la liste en mémoire
  const newMission = {
    id: `mission${Date.now()}`, // Générer un ID unique pour le mode démo
    name: data.name,
    client: data.client,
    description: data.description,
    sdrId: data.sdrId,
    sdrName: "Sales Representative",
    createdAt: new Date(),
    requests: []
  };
  
  // Ajouter à la liste de mock data
  mockData.missions.push(newMission);
  
  return newMission;
};
