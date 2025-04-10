
import { Mission } from "@/types/types";
import { isSupabaseConfigured } from "./missions/config";
import { MissionInput } from "./missions/types";
import {
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  createMockMission,
  findMockMissionById,
  deleteMockMission,
  assignSDRToMockMission
} from "./missions/mockMissions";
import {
  getAllSupaMissions,
  getSupaMissionsByUserId,
  getSupaMissionById,
  createSupaMission,
  deleteSupaMission,
  assignSDRToSupaMission
} from "./missions/index";

// Ré-exporter les fonctions mockées pour la compatibilité
export { findMockMissionById } from "./missions/mockMissions";

// Vérifier si un utilisateur est connecté avec Supabase
const isSupabaseAuthenticated = async (): Promise<boolean> => {
  try {
    // Importer dynamiquement pour éviter les problèmes de référence circulaire
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification Supabase:", error);
    return false;
  }
};

// Obtenir toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      return getAllMockMissions();
    }

    const missions = await getAllSupaMissions();
    
    if (missions.length === 0) {
      return getAllMockMissions();
    }
    
    return missions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return getAllMockMissions();
  }
};

// Obtenir les missions par utilisateur
export const getMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      return getMockMissionsByUserId(userId);
    }

    const missions = await getSupaMissionsByUserId(userId);
    
    if (missions.length === 0) {
      return getMockMissionsByUserId(userId);
    }
    
    return missions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return getMockMissionsByUserId(userId);
  }
};

// Pour compatibilité, créer un alias de getMissionsByUserId
export const getMissionsBySdrId = getMissionsByUserId;

// Obtenir une mission par ID
export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      return getMockMissionById(missionId);
    }

    const mission = await getSupaMissionById(missionId);
    if (!mission) {
      return getMockMissionById(missionId);
    }
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la mission:", error);
    return getMockMissionById(missionId);
  }
};

// Créer une nouvelle mission
export const createMission = async (data: MissionInput): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      return createMockMission(data);
    }

    const mission = await createSupaMission(data);
    if (!mission) {
      return createMockMission(data);
    }
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return createMockMission(data);
  }
};

// Supprimer une mission
export const deleteMission = async (missionId: string): Promise<boolean> => {
  if (!missionId) {
    console.error("ID de mission invalide ou manquant");
    return false;
  }

  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      const result = await deleteMockMission(missionId);
      return result.success;
    }

    const result = await deleteSupaMission(missionId);
    
    if (!result.success) {
      const mockResult = await deleteMockMission(missionId);
      return mockResult.success;
    }
    
    return result.success;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de la mission:", error);
    try {
      const mockResult = await deleteMockMission(missionId);
      return mockResult.success;
    } catch (innerError) {
      console.error("Échec de la suppression de secours:", innerError);
      return false;
    }
  }
};

// Assigner un SDR à une mission
export const assignSDRToMission = async (missionId: string, sdrId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      const result = await assignSDRToMockMission(missionId, sdrId);
      return result.success;
    }

    const result = await assignSDRToSupaMission(missionId, sdrId);
    if (!result || !result.success) {
      const mockResult = await assignSDRToMockMission(missionId, sdrId);
      return mockResult.success;
    }
    
    return result.success;
  } catch (error) {
    console.error("Erreur inattendue lors de l'assignation du SDR:", error);
    const mockResult = await assignSDRToMockMission(missionId, sdrId);
    return mockResult.success;
  }
};
