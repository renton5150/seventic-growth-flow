
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";
import { getUserById } from "@/data/users";

// Récupérer toutes les missions
export const getAllSupaMissions = async (): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      throw error;
    }

    // Convertir les missions du format Supabase au format de l'application
    return missions.map(mission => {
      const sdr = getUserById(mission.sdr_id);
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client || "",
        sdrId: mission.sdr_id || "",
        description: mission.description,
        createdAt: new Date(mission.created_at),
        sdrName: sdr?.name || "Non assigné",
        requests: getRequestsByMissionId(mission.id),
        startDate: mission.start_date ? new Date(mission.start_date) : null,
        endDate: mission.end_date ? new Date(mission.end_date) : null,
        type: (mission.type as MissionType) || "Full"
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des missions:", error);
    throw error;
  }
};

// Récupérer les missions d'un utilisateur
export const getSupaMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    const { data: missions, error } = await supabase
      .from("missions")
      .select("*")
      .eq("sdr_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      throw error;
    }

    return missions.map(mission => {
      const sdr = getUserById(mission.sdr_id);
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client || "",
        sdrId: mission.sdr_id || "",
        description: mission.description,
        createdAt: new Date(mission.created_at),
        sdrName: sdr?.name || "Non assigné",
        requests: getRequestsByMissionId(mission.id),
        startDate: mission.start_date ? new Date(mission.start_date) : null,
        endDate: mission.end_date ? new Date(mission.end_date) : null,
        type: (mission.type as MissionType) || "Full"
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des missions:", error);
    throw error;
  }
};

// Récupérer une mission par ID
export const getSupaMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const { data: mission, error } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Code erreur quand aucune ligne n'est trouvée
        return undefined;
      }
      console.error("Erreur lors de la récupération de la mission:", error);
      throw error;
    }

    if (!mission) return undefined;

    const sdr = getUserById(mission.sdr_id);
    return {
      id: mission.id,
      name: mission.name,
      client: mission.client || "",
      sdrId: mission.sdr_id || "",
      description: mission.description,
      createdAt: new Date(mission.created_at),
      sdrName: sdr?.name || "Non assigné",
      requests: getRequestsByMissionId(mission.id),
      startDate: mission.start_date ? new Date(mission.start_date) : null,
      endDate: mission.end_date ? new Date(mission.end_date) : null,
      type: (mission.type as MissionType) || "Full"
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la mission:", error);
    throw error;
  }
};

// Créer une nouvelle mission
export const createSupaMission = async (data: {
  name: string;
  client: string;
  sdrId: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
}): Promise<Mission | undefined> => {
  try {
    // Créer un ID unique pour la mission
    const missionId = uuidv4();
    
    const { data: mission, error } = await supabase
      .from("missions")
      .insert([
        {
          id: missionId,
          name: data.name,
          client: data.client || "Client non spécifié",
          sdr_id: data.sdrId,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          type: data.type || "Full"
        }
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Erreur lors de la création de la mission:", error);
      throw error;
    }

    const sdr = getUserById(mission.sdr_id);
    return {
      id: mission.id,
      name: mission.name,
      client: mission.client,
      sdrId: mission.sdr_id,
      description: mission.description,
      createdAt: new Date(mission.created_at),
      sdrName: sdr?.name || "Non assigné",
      requests: [],
      startDate: mission.start_date ? new Date(mission.start_date) : null,
      endDate: mission.end_date ? new Date(mission.end_date) : null,
      type: (mission.type as MissionType) || "Full"
    };
  } catch (error) {
    console.error("Erreur lors de la création de la mission:", error);
    throw error;
  }
};

// Supprimer une mission
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId);

    if (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de la mission:", error);
    return false;
  }
};
