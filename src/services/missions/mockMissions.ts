
import { Mission } from "@/types/types";
import { getMissionById, getMissionsBySdrId, missions } from "@/data/missions";
import { MissionInput, AssignmentResult, DeletionResult } from "./types";

// Récupérer toutes les missions mockées
export const getAllMockMissions = (): Mission[] => {
  console.log("getAllMockMissions: Récupération de toutes les missions mockées");
  
  // Récupérer toutes les missions et les formater avec le nom du SDR
  const allMissions = missions.map(mission => {
    return {
      ...mission,
      sdrName: mission.sdrName || "John Doe (Mock)",
    };
  });
  
  console.log("Nombre de missions mockées:", allMissions.length);
  return allMissions;
};

// Récupérer les missions par ID utilisateur
export const getMockMissionsByUserId = (userId: string): Mission[] => {
  console.log("getMockMissionsByUserId: Récupération des missions de l'utilisateur", userId);
  const userMissions = getMissionsBySdrId(userId);
  return userMissions;
};

// Récupérer une mission par ID
export const getMockMissionById = (id: string): Mission | undefined => {
  console.log("getMockMissionById: Récupération de la mission", id);
  return getMissionById(id);
};

// On réexporte findMockMissionById pour la compatibilité avec le code existant
export const findMockMissionById = getMockMissionById;

// Créer une nouvelle mission mockée
export const createMockMission = (data: MissionInput): Mission => {
  console.log("createMockMission: Création d'une nouvelle mission mockée", data);
  
  const newMissionId = `mission${missions.length + 1}`;
  const newMission: Mission = {
    id: newMissionId,
    name: data.name,
    client: data.client || "Default Client",
    sdrId: data.sdrId,
    sdrName: data.sdrName || "Non assigné",
    createdAt: new Date(),
    startDate: data.startDate || new Date(),
    requests: []
  };
  
  // Ajouter la mission au tableau des missions (simulation)
  missions.push(newMission);
  
  console.log("Mission mockée créée:", newMission);
  return newMission;
};

// Supprimer une mission mockée
export const deleteMockMission = async (id: string): Promise<DeletionResult> => {
  console.log("deleteMockMission: Suppression de la mission", id);
  
  // Rechercher l'index de la mission
  const missionIndex = missions.findIndex(mission => mission.id === id);
  
  if (missionIndex === -1) {
    console.log("Mission non trouvée avec l'ID:", id);
    return { success: false, error: "Mission not found" };
  }
  
  try {
    // Supprimer la mission du tableau (simulation)
    missions.splice(missionIndex, 1);
    console.log("Mission supprimée avec succès:", id);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la mission:", error);
    return { success: false, error: String(error) };
  }
};

// Assigner un SDR à une mission mockée
export const assignSDRToMockMission = async (missionId: string, sdrId: string): Promise<AssignmentResult> => {
  console.log(`assignSDRToMockMission: Assignation du SDR ${sdrId} à la mission ${missionId}`);
  
  // Rechercher la mission
  const missionIndex = missions.findIndex(mission => mission.id === missionId);
  
  if (missionIndex === -1) {
    console.log("Mission non trouvée avec l'ID:", missionId);
    return { success: false, error: "Mission not found" };
  }
  
  try {
    // Mettre à jour le SDR de la mission
    missions[missionIndex].sdrId = sdrId;
    missions[missionIndex].sdrName = "SDR Assigné"; // Nom par défaut, en situation réelle on récupérerait le nom du SDR
    
    console.log("SDR assigné avec succès à la mission:", missionId);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'assignation du SDR à la mission:", error);
    return { success: false, error: String(error) };
  }
};
