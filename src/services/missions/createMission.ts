
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
    
    // Validate data
    if (!data.name || data.name.trim() === '') {
      console.error("Nom de mission manquant dans createSupaMission!");
      throw new Error("Le nom est requis pour créer une mission");
    }
    
    // Ne pas générer l'ID manuellement, laisser Supabase le faire
    
    // Prepare data for Supabase
    const missionData = {
      // id: missionId, // Supprimé pour laisser Supabase générer l'ID
      name: data.name,
      sdr_id: data.sdrId || null, // Accepte null pour les missions sans SDR attribué
      description: data.description || "",
      start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      type: data.type || "Full",
      client: data.name // Utilise le nom comme valeur pour client (requis par le schéma)
    };
    
    console.log("Données formatées pour Supabase:", missionData);
    console.log("SDR ID qui sera inséré:", missionData.sdr_id);

    // Explicitement utiliser single() pour capturer les erreurs
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

    if (!mission) {
      console.error("Aucune donnée retournée après insertion de la mission");
      return undefined;
    }

    console.log("Données retournées par Supabase après insertion:", mission);
    
    // Vérifier que l'ID de mission est bien défini
    if (!mission.id) {
      console.error("ID de mission manquant dans les données retournées");
      return undefined;
    }
    
    return mapSupaMissionToMission(mission);
  } catch (error) {
    console.error("Exception lors de la création de la mission:", error);
    throw error;
  }
};
