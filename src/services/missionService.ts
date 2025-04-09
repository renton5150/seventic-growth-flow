import { Mission } from "@/types/types";
import { isSupabaseConfigured } from "./missions/config";
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
} from "./missions/supaMissions";

// Ré-exporter les fonctions mockées pour la compatibilité
export { findMockMissionById, getMockMissionsBySdrId } from "./missions/mockMissions";

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
    console.log("Récupération de toutes les missions, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation des données mockées pour toutes les missions");
      return getAllMockMissions();
    }

    const missions = await getAllSupaMissions();
    if (missions.length === 0) {
      console.log("Aucune mission trouvée dans Supabase, fallback vers les données mockées");
      return getAllMockMissions();
    }
    
    return missions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    console.log("Fallback vers les données mockées");
    return getAllMockMissions();
  }
};

// Obtenir les missions par utilisateur
export const getMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Récupération des missions d'utilisateur, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation des données mockées pour les missions d'utilisateur");
      return getMockMissionsByUserId(userId);
    }

    const missions = await getSupaMissionsByUserId(userId);
    if (missions.length === 0) {
      console.log("Aucune mission trouvée dans Supabase pour cet utilisateur, fallback vers les données mockées");
      return getMockMissionsByUserId(userId);
    }
    
    return missions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    console.log("Fallback vers les données mockées");
    return getMockMissionsByUserId(userId);
  }
};

// Obtenir une mission par ID
export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Récupération d'une mission par ID, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation des données mockées pour une mission");
      return getMockMissionById(missionId);
    }

    const mission = await getSupaMissionById(missionId);
    if (!mission) {
      console.log("Aucune mission trouvée dans Supabase avec cet ID, fallback vers les données mockées");
      return getMockMissionById(missionId);
    }
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la mission:", error);
    console.log("Fallback vers les données mockées");
    return getMockMissionById(missionId);
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
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Création d'une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour la création de mission");
      return createMockMission(data);
    }

    const mission = await createSupaMission(data);
    if (!mission) {
      console.log("Échec de création dans Supabase, fallback vers les données mockées");
      return createMockMission(data);
    }
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    console.log("Fallback vers les données mockées");
    return createMockMission(data);
  }
};

// Supprimer une mission
export const deleteMission = async (missionId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Suppression d'une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour la suppression de mission");
      return deleteMockMission(missionId);
    }

    const success = await deleteSupaMission(missionId);
    if (!success) {
      console.log("Échec de suppression dans Supabase, fallback vers les données mockées");
      return deleteMockMission(missionId);
    }
    
    return success;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de la mission:", error);
    console.log("Fallback vers les données mockées");
    return deleteMockMission(missionId);
  }
};

// Assigner un SDR à une mission
export const assignSDRToMission = async (missionId: string, sdrId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Assignation d'un SDR à une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour l'assignation de SDR");
      return assignSDRToMockMission(missionId, sdrId);
    }

    const success = await assignSDRToSupaMission(missionId, sdrId);
    if (!success) {
      console.log("Échec d'assignation dans Supabase, fallback vers les données mockées");
      return assignSDRToMockMission(missionId, sdrId);
    }
    
    return success;
  } catch (error) {
    console.error("Erreur inattendue lors de l'assignation du SDR:", error);
    console.log("Fallback vers les données mockées");
    return assignSDRToMockMission(missionId, sdrId);
  }
};
