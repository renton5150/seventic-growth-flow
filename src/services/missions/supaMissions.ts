
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getRequestsByMissionId } from "@/data/requests";
import { getUserById } from "@/data/users";

// Function to map Supabase response to Mission type
export function mapSupaMissionToMission(mission: any): Mission {
  console.log("Données reçues de Supabase à mapper:", mission);
  
  // Check for sdr_id
  if (!mission.sdr_id) {
    console.warn("sdr_id manquant dans les données Supabase:", mission);
  }
  
  // Attempt to get SDR name from different possible sources
  let sdrName = "Non assigné";
  
  // If we have profiles data from a join
  if (mission.profiles) {
    sdrName = mission.profiles.name || "Non assigné";
  } else {
    // Fallback to get user from mock data
    const sdr = getUserById(mission.sdr_id);
    sdrName = sdr?.name || "Non assigné";
  }
  
  return {
    id: mission.id,
    name: mission.name,
    client: mission.client || "",
    sdrId: mission.sdr_id, // Critical conversion point
    description: mission.description || "",
    createdAt: new Date(mission.created_at),
    sdrName: sdrName,
    requests: getRequestsByMissionId(mission.id),
    startDate: mission.start_date ? new Date(mission.start_date) : null,
    endDate: mission.end_date ? new Date(mission.end_date) : null,
    type: (mission.type as MissionType) || "Full"
  };
}

// Récupérer toutes les missions
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
    return missions.map(mission => mapSupaMissionToMission(mission));
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

    return missions.map(mission => mapSupaMissionToMission(mission));
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

    return mapSupaMissionToMission(mission);
  } catch (error) {
    console.error("Erreur lors de la récupération de la mission:", error);
    throw error;
  }
};

// Vérifier si une mission existe
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

// Créer une nouvelle mission
export const createSupaMission = async (data: {
  name: string;
  client: string;
  sdrId: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: MissionType | string;
}): Promise<Mission | undefined> => {
  try {
    console.log("Mission reçue dans createSupaMission:", data);
    console.log("SDR ID reçu:", data.sdrId);
    
    // Validate sdrId
    if (!data.sdrId) {
      console.error("SDR ID manquant dans createSupaMission!");
      throw new Error("Le SDR est requis pour créer une mission");
    }
    
    const missionId = uuidv4();
    
    // Prepare data for Supabase
    const missionData = {
      id: missionId,
      name: data.name,
      client: data.client || "Client non spécifié",
      sdr_id: data.sdrId, // Critical conversion point
      description: data.description || "",
      start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      type: data.type || "Full"
    };
    
    console.log("Données formatées pour Supabase:", missionData);
    console.log("SDR ID qui sera inséré:", missionData.sdr_id);

    const { data: mission, error } = await supabase
      .from("missions")
      .insert([missionData])
      .select("*")
      .single();

    if (error) {
      console.error("Erreur lors de la création de la mission:", error);
      throw error;
    }

    console.log("Données retournées par Supabase après insertion:", mission);
    
    // Verify sdr_id was properly saved
    if (!mission.sdr_id) {
      console.error("sdr_id manquant dans les données retournées:", mission);
    }

    return mapSupaMissionToMission(mission);
  } catch (error) {
    console.error("Erreur lors de la création de la mission:", error);
    throw error;
  }
};

// Mettre à jour une mission existante
export const updateSupaMission = async (mission: {
  id: string;
  name: string;
  client?: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType | string;
}): Promise<Mission> => {
  console.log("updateSupaMission reçoit:", mission);
  
  // Check if mission exists
  const { data: existingMission, error: checkError } = await supabase
    .from("missions")
    .select("id")
    .eq("id", mission.id)
    .maybeSingle();
  
  if (checkError) {
    console.error("Erreur lors de la vérification de l'existence:", checkError);
    throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
  }
  
  if (!existingMission) {
    console.error("Mission introuvable:", mission.id);
    throw new Error("La mission n'existe pas");
  }
  
  // Validate sdrId
  if (!mission.sdrId) {
    console.error("SDR ID manquant lors de la mise à jour!");
    throw new Error("Le SDR est requis pour mettre à jour une mission");
  }
  
  // Prepare data for Supabase
  const supabaseData = {
    name: mission.name,
    client: mission.client || "",
    sdr_id: mission.sdrId, // Critical conversion point
    description: mission.description || "",
    start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
    end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
    type: mission.type || "Full",
  };
  
  console.log("Données formatées pour mise à jour Supabase:", supabaseData);
  console.log("SDR ID qui sera mis à jour:", supabaseData.sdr_id);
  
  const { data, error } = await supabase
    .from("missions")
    .update(supabaseData)
    .eq("id", mission.id)
    .select()
    .single();
  
  if (error) {
    console.error("Erreur Supabase lors de la mise à jour:", error);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }
  
  console.log("Réponse de Supabase après mise à jour:", data);
  
  // Verify sdr_id was properly saved
  if (!data.sdr_id) {
    console.error("sdr_id manquant dans les données retournées après mise à jour:", data);
  }
  
  return mapSupaMissionToMission(data);
};

// Supprimer une mission
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  console.log("Suppression de mission dans Supabase. ID:", missionId);
  
  // Check if mission exists
  const { data: existingMission, error: checkError } = await supabase
    .from("missions")
    .select("id")
    .eq("id", missionId)
    .maybeSingle();
  
  if (checkError) {
    console.error("Erreur lors de la vérification de l'existence:", checkError);
    throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
  }
  
  if (!existingMission) {
    console.error("Tentative de suppression d'une mission inexistante:", missionId);
    throw new Error("La mission n'existe pas");
  }
  
  // Delete the mission
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);
  
  if (error) {
    console.error("Erreur lors de la suppression:", error);
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
  
  // Verify deletion
  const { data: checkAfterDelete, error: verifyError } = await supabase
    .from("missions")
    .select("id")
    .eq("id", missionId)
    .maybeSingle();
  
  if (verifyError) {
    console.error("Erreur lors de la vérification après suppression:", verifyError);
  }
  
  if (checkAfterDelete) {
    console.error("La mission existe toujours après suppression");
    throw new Error("Échec de la suppression: la mission existe toujours");
  }
  
  console.log("Mission supprimée avec succès");
  return true;
};
