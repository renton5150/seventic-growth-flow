import { Mission } from "@/types/types";
import { v4 as uuidv4 } from 'uuid';

// Fonction utilitaire pour simuler un délai d'attente
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let mockMissions: Mission[] = [
  {
    id: "a7447441-44c9-449c-b199-3ca4211f3199",
    name: "Mission Test",
    client: "Entreprise Test",
    sdrId: "user123",
    sdrName: "John Doe",
    createdAt: new Date(),
    requests: [],
  },
  {
    id: "b7447441-44c9-449c-b199-3ca4211f3200",
    name: "Mission Example",
    client: "Acme Corp",
    sdrId: "user456",
    sdrName: "Jane Smith",
    createdAt: new Date(),
    requests: [],
  },
  {
    id: "c7447441-44c9-449c-b199-3ca4211f3201",
    name: "Mission Demo",
    client: "Beta Co",
    sdrId: "user123",
    sdrName: "John Doe",
    createdAt: new Date(),
    requests: [],
  },
];

// Obtenir toutes les missions mockées
export const getAllMockMissions = async (): Promise<Mission[]> => {
  await sleep(500); // Simuler un délai d'attente
  console.log("Récupération de toutes les missions mockées");
  return mockMissions;
};

// Obtenir les missions mockées par utilisateur
export const getMockMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  await sleep(300); // Simuler un délai d'attente
  console.log(`Récupération des missions mockées pour l'utilisateur avec l'ID : ${userId}`);
  return mockMissions.filter(mission => mission.sdrId === userId);
};

// Obtenir les missions mockées par SDR ID (identique à getMockMissionsByUserId)
export const getMockMissionsBySdrId = async (sdrId: string): Promise<Mission[]> => {
  await sleep(300); // Simuler un délai d'attente
  console.log(`Récupération des missions mockées pour le SDR avec l'ID : ${sdrId}`);
  return mockMissions.filter(mission => mission.sdrId === sdrId);
};

// Obtenir une mission mockée par ID
export const getMockMissionById = async (missionId: string): Promise<Mission | undefined> => {
  await sleep(300); // Simuler un délai d'attente
  console.log(`Récupération de la mission mockée avec l'ID : ${missionId}`);
  return mockMissions.find(mission => mission.id === missionId);
};

// Trouver une mission mockée par ID (synchrone)
export const findMockMissionById = (missionId: string): Mission | undefined => {
  console.log(`Recherche synchrone de la mission mockée avec l'ID : ${missionId}`);
  return mockMissions.find(mission => mission.id === missionId);
};

// Créer une nouvelle mission mockée
export const createMockMission = async (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
}): Promise<Mission> => {
  await sleep(500); // Simuler un délai d'attente
  console.log("Création d'une nouvelle mission mockée");

  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    client: data.client,
    description: data.description,
    sdrId: data.sdrId,
    sdrName: "Mock SDR Name", // Vous pouvez adapter cela si nécessaire
    createdAt: new Date(),
    requests: [],
  };

  mockMissions.push(newMission);
  return newMission;
};

// Supprimer une mission mockée
export const deleteMockMission = async (missionId: string): Promise<boolean> => {
  try {
    console.log("Suppression de mission mockée pour l'ID:", missionId);
    
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Recherche de la mission par ID
    const missionIndex = mockMissions.findIndex(mission => mission.id === missionId);
    
    if (missionIndex === -1) {
      console.warn("Mission non trouvée pour la suppression:", missionId);
      return false;
    }
    
    // Supprimer la mission du tableau
    mockMissions.splice(missionIndex, 1);
    
    console.log("Mission mockée supprimée avec succès:", missionId);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de mission mockée:", error);
    return false;
  }
};
