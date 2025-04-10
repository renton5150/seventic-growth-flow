
import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { getRequestsByMissionId } from "../requestService";
import { isValidUUID } from "./utils";

/**
 * Obtenir toutes les missions depuis Supabase
 */
export const getAllSupaMissions = async (): Promise<Mission[]> => {
  try {
    console.log("Récupération des missions depuis Supabase");
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

    console.log("Missions récupérées depuis Supabase:", missions);

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

/**
 * Obtenir les missions par utilisateur depuis Supabase
 */
export const getSupaMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    console.log("Récupération des missions d'utilisateur depuis Supabase pour userId:", userId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner un tableau vide
    if (!isValidUUID(userId)) {
      console.warn("ID utilisateur non valide pour Supabase:", userId);
      return [];
    }
    
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

    console.log("Missions utilisateur récupérées depuis Supabase:", missions);

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

/**
 * Obtenir une mission par ID depuis Supabase
 */
export const getSupaMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    console.log("Récupération d'une mission depuis Supabase par ID:", missionId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner undefined
    if (!isValidUUID(missionId)) {
      console.warn("ID mission non valide pour Supabase:", missionId);
      return undefined;
    }
    
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

    console.log("Mission récupérée depuis Supabase:", mission);

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
