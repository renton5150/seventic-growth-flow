
import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { getRequestsByMissionId } from "../requestService";

// Obtenir toutes les missions depuis Supabase
export const getAllSupaMissions = async (): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `);

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
        sdrId: mission.sdr_id || "",
        sdrName: mission.profiles?.name || "Inconnu",
        createdAt: new Date(mission.created_at),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir les missions par utilisateur depuis Supabase
export const getSupaMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `)
      .eq('sdr_id', userId);

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
        sdrId: mission.sdr_id || "",
        sdrName: mission.profiles?.name || "Inconnu",
        createdAt: new Date(mission.created_at),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir une mission par ID depuis Supabase
export const getSupaMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `)
      .eq('id', missionId)
      .maybeSingle();

    if (error || !mission) {
      console.error("Erreur lors de la récupération de la mission:", error);
      return undefined;
    }

    const requests = await getRequestsByMissionId(mission.id);

    return {
      id: mission.id,
      name: mission.name,
      client: mission.client,
      description: mission.description || undefined,
      sdrId: mission.sdr_id || "",
      sdrName: mission.profiles?.name || "Inconnu",
      createdAt: new Date(mission.created_at),
      requests
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la mission:", error);
    return undefined;
  }
};

// Créer une nouvelle mission dans Supabase
export const createSupaMission = async (data: {
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
      sdr_id: data.sdrId
    };

    const { data: newMission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `)
      .maybeSingle();

    if (error || !newMission) {
      console.error("Erreur lors de la création de la mission:", error);
      return undefined;
    }

    return {
      id: newMission.id,
      name: newMission.name,
      client: newMission.client,
      description: newMission.description || undefined,
      sdrId: newMission.sdr_id || "",
      sdrName: newMission.profiles?.name || "Inconnu",
      createdAt: new Date(newMission.created_at),
      requests: []
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return undefined;
  }
};
