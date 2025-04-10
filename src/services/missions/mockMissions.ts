
// src/services/missions/mockMissions.ts
import { v4 as uuidv4 } from 'uuid';
import { Mission } from '@/types/types';
import { MissionInput } from './types';
import { missions as mockMissionsData } from '@/data/missions';

// Cache local pour simuler une base de données
let localMissionCache: Mission[] = [...mockMissionsData];

/**
 * Récupérer toutes les missions mockées
 */
export const getAllMockMissions = (): Mission[] => {
  console.log("getAllMockMissions: Récupération de toutes les missions mockées");
  console.log(`Nombre de missions mockées: ${localMissionCache.length}`);
  return [...localMissionCache];
};

/**
 * Récupérer les missions mockées par ID d'utilisateur
 */
export const getMockMissionsByUserId = (userId: string): Mission[] => {
  console.log(`getMockMissionsByUserId: Récupération des missions pour l'utilisateur ${userId}`);
  const missions = localMissionCache.filter(mission => mission.sdrId === userId);
  console.log(`Nombre de missions trouvées: ${missions.length}`);
  return [...missions];
};

/**
 * Récupérer les missions mockées par ID de SDR
 */
export const getMockMissionsBySdrId = (sdrId: string): Mission[] => {
  console.log(`getMockMissionsBySdrId: Récupération des missions pour le SDR ${sdrId}`);
  const missions = localMissionCache.filter(mission => mission.sdrId === sdrId);
  console.log(`Nombre de missions trouvées: ${missions.length}`);
  return [...missions];
};

/**
 * Récupérer une mission mockée par son ID
 */
export const getMockMissionById = (id: string): Mission | undefined => {
  console.log(`getMockMissionById: Recherche de la mission avec l'ID ${id}`);
  
  // Vérifier que l'ID est défini et non vide
  if (!id) {
    console.error("getMockMissionById: ID non fourni");
    return undefined;
  }
  
  const mission = localMissionCache.find(mission => mission.id === id);
  
  if (mission) {
    console.log(`Mission trouvée: ${mission.name}`);
    return { ...mission };
  } else {
    console.log(`Aucune mission trouvée avec l'ID ${id}`);
    return undefined;
  }
};

/**
 * Trouver une mission dans le cache local par son ID - fonction de support interne
 */
export const findMockMissionById = (id: string): Mission | undefined => {
  return localMissionCache.find(mission => mission.id === id);
};

/**
 * Créer une nouvelle mission mockée
 */
export const createMockMission = (data: MissionInput): Mission => {
  console.log("createMockMission: Création d'une nouvelle mission");
  console.log("Données:", data);
  
  const newMission: Mission = {
    id: uuidv4(),
    name: data.name,
    client: data.client || 'Default Client',
    description: data.description,
    sdrId: data.sdrId || '',
    sdrName: 'Non assigné',
    createdAt: new Date(),
    startDate: data.startDate || new Date(),
    requests: []
  };
  
  localMissionCache.push(newMission);
  console.log(`Mission créée avec l'ID ${newMission.id}`);
  return { ...newMission };
};

/**
 * Supprimer une mission mockée
 */
export const deleteMockMission = async (id: string): Promise<{ success: boolean, error?: string }> => {
  console.log(`deleteMockMission: Suppression de la mission avec l'ID ${id}`);
  
  if (!id) {
    console.error("deleteMockMission: ID non fourni");
    return { success: false, error: "ID de mission non fourni" };
  }
  
  const initialLength = localMissionCache.length;
  const missionToDelete = localMissionCache.find(mission => mission.id === id);
  
  if (!missionToDelete) {
    console.log(`Mission avec l'ID ${id} non trouvée`);
    return { success: false, error: "Mission non trouvée" };
  }
  
  // Filtrer la mission à supprimer
  localMissionCache = localMissionCache.filter(mission => mission.id !== id);
  
  // Vérifier si la mission a été supprimée
  const success = initialLength > localMissionCache.length;
  console.log(`Suppression ${success ? "réussie" : "échouée"}`);
  console.log(`État du cache après suppression: ${localMissionCache.length} missions`);
  
  // Simuler un délai réseau pour rendre la suppression plus réaliste
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return { success };
};

/**
 * Assigner un SDR à une mission mockée
 */
export const assignSDRToMockMission = async (
  missionId: string, 
  sdrId: string
): Promise<{ success: boolean, error?: string }> => {
  console.log(`assignSDRToMockMission: Assignation du SDR ${sdrId} à la mission ${missionId}`);
  
  if (!missionId || !sdrId) {
    console.error("ID de mission ou de SDR non fourni");
    return { success: false, error: "ID de mission ou de SDR non fourni" };
  }
  
  // Trouver l'index de la mission à mettre à jour
  const missionIndex = localMissionCache.findIndex(mission => mission.id === missionId);
  
  if (missionIndex === -1) {
    console.log(`Mission avec l'ID ${missionId} non trouvée`);
    return { success: false, error: "Mission non trouvée" };
  }
  
  // Mettre à jour la mission
  localMissionCache[missionIndex] = {
    ...localMissionCache[missionIndex],
    sdrId,
    sdrName: "SDR Assigné" // Dans un cas réel, nous récupérerions le nom du SDR depuis la DB
  };
  
  console.log("Assignation réussie");
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return { success: true };
};
