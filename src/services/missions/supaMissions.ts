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
  type?: string;
}): Promise<Mission | undefined> => {
  try {
    console.log("Mission reçue dans createSupaMission:", data);
    console.log("SDR ID reçu:", data.sdrId);
    
    if (!data.sdrId) {
      console.error("SDR ID manquant dans createSupaMission!");
      throw new Error("Le SDR est requis pour créer une mission");
    }
    
    const missionId = uuidv4();
    
    const missionData = {
      id: missionId,
      name: data.name,
      client: data.client || "Client non spécifié",
      sdr_id: data.sdrId,
      description: data.description,
      start_date: data.startDate ? data.startDate.toISOString() : null,
      end_date: data.endDate ? data.endDate.toISOString() : null,
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

// Mettre à jour une mission existante
export const updateSupaMission = async (mission: {
  id: string;
  name: string;
  client?: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType;
}): Promise<Mission> => {
  console.log("updateSupaMission reçoit:", mission);
  
  const { data: existingMission, error: checkError } = await supabase
    .from("missions")
    .select("id")
    .eq("id", mission.id)
    .single();
  
  if (checkError) {
    console.error("Erreur lors de la vérification de l'existence:", checkError);
    throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
  }
  
  const supabaseData = {
    name: mission.name,
    client: mission.client || "",
    sdr_id: mission.sdrId,
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
  
  const sdr = getUserById(data.sdr_id);
  return {
    id: data.id,
    name: data.name,
    client: data.client,
    sdrId: data.sdr_id,
    description: data.description,
    createdAt: new Date(data.created_at),
    sdrName: sdr?.name || "Non assigné",
    requests: getRequestsByMissionId(data.id),
    startDate: data.start_date ? new Date(data.start_date) : null,
    endDate: data.end_date ? new Date(data.end_date) : null,
    type: (data.type as MissionType) || "Full"
  };
};

// Supprimer une mission
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  console.log("Suppression de mission dans Supabase. ID:", missionId);
  
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
  
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);
  
  if (error) {
    console.error("Erreur lors de la suppression:", error);
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
  
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
