
import { Mission, MissionType } from "@/types/types";
import { isSupabaseConfigured } from "./missions/config";
import {
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionById,
  createMockMission,
  findMockMissionById,
  deleteMockMission,
  updateMockMission
} from "./missions/mockMissions";
import {
  getAllSupaMissions,
  getSupaMissionsByUserId,
  getSupaMissionById,
  createSupaMission,
  deleteSupaMission,
  checkMissionExists,
  updateSupaMission
} from "./missions/supaMissions";

// Ré-exporter les fonctions mockées pour la compatibilité
export { findMockMissionById, getMockMissionsBySdrId } from "./missions/mockMissions";

// Ré-exporter la fonction de vérification d'existence
export { checkMissionExists } from "./missions/supaMissions";

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
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Création d'une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    console.log("Données reçues dans createMission:", data);
    console.log("SDR ID reçu:", data.sdrId);
    
    // Vérifier si sdrId est défini
    if (!data.sdrId) {
      console.error("SDR ID manquant!");
      throw new Error("Le SDR est requis pour créer une mission");
    }
    
    // Assurer que le type est une valeur MissionType valide
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour la création de mission");
      return createMockMission({
        ...data,
        type: missionType
      });
    }

    const mission = await createSupaMission({
      ...data,
      type: missionType
    });
    
    if (!mission) {
      console.log("Échec de création dans Supabase, fallback vers les données mockées");
      return createMockMission({
        ...data,
        type: missionType
      });
    }
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    console.log("Fallback vers les données mockées");
    
    // Assurer que le type est une valeur MissionType valide
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    return createMockMission({
      ...data,
      type: missionType
    });
  }
};

// Mettre à jour une mission existante
export const updateMission = async (data: {
  id: string;
  name: string;
  client?: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
}): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Mise à jour d'une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    console.log("Données reçues dans updateMission:", data);
    console.log("SDR ID reçu:", data.sdrId);
    
    // Vérifier si sdrId est défini
    if (!data.sdrId) {
      console.error("SDR ID manquant!");
      throw new Error("Le SDR est requis pour mettre à jour une mission");
    }
    
    // Assurer que le type est une valeur MissionType valide
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour la mise à jour de mission");
      return updateMockMission({
        ...data,
        type: missionType
      });
    }

    const mission = await updateSupaMission({
      ...data,
      type: missionType
    });
    
    return mission;
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour de la mission:", error);
    console.log("Fallback vers les données mockées");
    
    // Assurer que le type est une valeur MissionType valide
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    return updateMockMission({
      ...data,
      type: missionType
    });
  }
};

// Supprimer une mission par ID
export const deleteMission = async (missionId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    console.log("Suppression d'une mission, Supabase configuré:", isSupabaseConfigured);
    console.log("Utilisateur authentifié avec Supabase:", isAuthenticated);
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Utilisation du mock pour la suppression de mission");
      return deleteMockMission(missionId);
    }

    // Vérifier si la mission existe avant de tenter de la supprimer
    const exists = await checkMissionExists(missionId);
    if (!exists) {
      console.error("Mission inexistante:", missionId);
      throw new Error("La mission n'existe pas ou a déjà été supprimée");
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
