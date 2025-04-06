
import { Mission } from "@/types/types";
import { isSupabaseConfigured } from "./missions/config";
import {
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  createMockMission,
  findMockMissionById
} from "./missions/mockMissions";
import {
  getAllSupaMissions,
  getSupaMissionsByUserId,
  getSupaMissionById,
  createSupaMission
} from "./missions/supaMissions";

// Ré-exporter les fonctions mockées pour la compatibilité
export { findMockMissionById, getMockMissionsBySdrId } from "./missions/mockMissions";

// Obtenir toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    if (!isSupabaseConfigured) {
      return getAllMockMissions();
    }

    return getAllSupaMissions();
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir les missions par utilisateur
export const getMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    if (!isSupabaseConfigured) {
      return getMockMissionsByUserId(userId);
    }

    return getSupaMissionsByUserId(userId);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir une mission par ID
export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    if (!isSupabaseConfigured) {
      return getMissionById(missionId);
    }

    return getSupaMissionById(missionId);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la mission:", error);
    return undefined;
  }
};

// Créer une nouvelle mission
export const createMission = async (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
}): Promise<Mission | undefined> => {
  try {
    if (!isSupabaseConfigured) {
      return createMockMission(data);
    }

    return createSupaMission(data);
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return undefined;
  }
};
