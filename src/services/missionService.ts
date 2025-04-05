
import { Mission, Request } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { getRequestsByMissionId } from "./requestService";

// Obtenir toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*, users:sdrId(name)')
      .order('createdAt', { ascending: false });

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
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*, users:sdrId(name)')
      .eq('sdrId', userId)
      .order('createdAt', { ascending: false });

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
      name: data.name,
      client: data.client,
      description: data.description,
      sdrId: data.sdrId,
      createdAt: new Date().toISOString()
    };

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
