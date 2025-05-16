import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "./utils";

/**
 * Récupérer toutes les missions
 */
export const getAllSupaMissions = async (): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from("missions")
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      throw error;
    }

    console.log("Missions récupérées avec données de profil:", missions);
    // Utiliser Promise.all pour attendre la résolution de toutes les promesses
    return Promise.all(missions.map(mission => mapSupaMissionToMission(mission)));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions:", error);
    throw error;
  }
};

/**
 * Récupérer les missions d'un utilisateur
 */
export const getSupaMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from("missions")
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .eq("sdr_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      throw error;
    }

    console.log("Missions d'un utilisateur:", missions);
    // Utiliser Promise.all pour attendre la résolution de toutes les promesses
    return Promise.all(missions.map(mission => mapSupaMissionToMission(mission)));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions:", error);
    throw error;
  }
};

/**
 * Récupérer une mission par ID
 */
export const getSupaMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const { data: mission, error } = await supabase
      .from("missions")
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .eq("id", missionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erreur lors de la récupération de la mission:", error);
      throw error;
    }

    if (!mission) return undefined;

    console.log("Mission individuelle récupérée:", mission);
    return mapSupaMissionToMission(mission);
  } catch (error) {
    console.error("Erreur lors de la récupération de la mission:", error);
    throw error;
  }
};

/**
 * Vérifier si une mission existe
 */
export const checkMissionExists = async (missionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors de la vérification de l'existence de la mission:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Exception lors de la vérification de l'existence de la mission:", error);
    return false;
  }
};
