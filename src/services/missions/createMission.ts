
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { mapSupaMissionToMission } from "./utils";

/**
 * Créer une nouvelle mission
 */
export const createSupaMission = async (data: {
  name: string;
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
      sdr_id: data.sdrId,
      description: data.description || "",
      start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      type: data.type || "Full",
      client: data.name // Utilise le nom comme valeur pour client (requis par le schéma)
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
      // Ajouter des informations détaillées sur l'erreur
      if (error.code === "42501") {
        throw new Error(`Erreur de permission: ${error.message} (RLS a refusé l'accès)`);
      } else if (error.code === "23505") {
        throw new Error(`Conflit de clé unique: ${error.message}`);
      } else if (error.code === "23503") {
        throw new Error(`Violation de contrainte de clé étrangère: ${error.message} (sdr_id non valide)`);
      } else {
        throw new Error(`Erreur Supabase [${error.code}]: ${error.message}`);
      }
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
