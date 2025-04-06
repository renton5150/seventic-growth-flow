
import { Mission, Request } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { getRequestsByMissionId } from "./requestService";
import { mockData, getMissionById as getMockMissionById, getMissionsBySdrId as getMockMissionsBySdrId } from "@/data/mockData";

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Obtenir toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Utilisation des données mockées pour les missions");
      return Promise.all(mockData.missions.map(async mission => {
        const requests = await getRequestsByMissionId(mission.id);
        return {
          ...mission,
          sdrName: mission.sdrId === "user2" ? "Sales Representative" : "Utilisateur inconnu",
          requests
        };
      }));
    }

    const { data: missions, error } = await supabase
      .from('missions')
      .select('*, users:sdrId(name)');

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      return [];
    }

    // Adapter les données au format attendu par l'application
    const formattedMissions = await Promise.all(missions.map(async (mission) => {
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client,
        description: mission.description || undefined,
        sdrId: mission.sdrId,
        sdrName: mission.users?.name || "Inconnu",
        createdAt: new Date(mission.createdAt),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir les missions par utilisateur
export const getMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Utilisation des données mockées pour les missions d'un utilisateur");
      return Promise.all(getMockMissionsBySdrId(userId).map(async mission => {
        const requests = await getRequestsByMissionId(mission.id);
        return {
          ...mission,
          requests
        };
      }));
    }

    const { data: missions, error } = await supabase
      .from('missions')
      .select('*, users:sdrId(name)')
      .eq('sdrId', userId);

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      return [];
    }

    // Adapter les données au format attendu par l'application
    const formattedMissions = await Promise.all(missions.map(async (mission) => {
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client,
        description: mission.description || undefined,
        sdrId: mission.sdrId,
        sdrName: mission.users?.name || "Inconnu",
        createdAt: new Date(mission.createdAt),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir une mission par ID
export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Utilisation des données mockées pour une mission par ID");
      const mission = getMockMissionById(missionId);
      if (!mission) return undefined;
      
      const requests = await getRequestsByMissionId(mission.id);
      return {
        ...mission,
        requests
      };
    }

    const { data: mission, error } = await supabase
      .from('missions')
      .select('*, users:sdrId(name)')
      .eq('id', missionId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de la mission:", error);
      return undefined;
    }

    const requests = await getRequestsByMissionId(mission.id);

    return {
      id: mission.id,
      name: mission.name,
      client: mission.client,
      description: mission.description || undefined,
      sdrId: mission.sdrId,
      sdrName: mission.users?.name || "Inconnu",
      createdAt: new Date(mission.createdAt),
      requests
    };
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
    const missionData = {
      id: `mission${Date.now()}`, // Générer un ID unique pour le mode démo
      name: data.name,
      client: data.client,
      description: data.description,
      sdrId: data.sdrId,
      createdAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      console.log("Mode démo: simulation de création de mission");
      // En mode démo, on ajoute simplement à la liste en mémoire
      const newMission = {
        id: missionData.id,
        name: missionData.name,
        client: missionData.client,
        description: missionData.description,
        sdrId: missionData.sdrId,
        sdrName: "Sales Representative",
        createdAt: new Date(),
        requests: []
      };
      
      // Ajouter à la liste de mock data
      mockData.missions.push(newMission);
      
      return newMission;
    }

    const { data: newMission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select('*, users:sdrId(name)')
      .single();

    if (error) {
      console.error("Erreur lors de la création de la mission:", error);
      return undefined;
    }

    return {
      id: newMission.id,
      name: newMission.name,
      client: newMission.client,
      description: newMission.description || undefined,
      sdrId: newMission.sdrId,
      sdrName: newMission.users?.name || "Inconnu",
      createdAt: new Date(newMission.createdAt),
      requests: []
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return undefined;
  }
};
