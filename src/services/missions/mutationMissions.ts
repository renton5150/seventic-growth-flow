
import { supabase } from "@/integrations/supabase/client";
import { MissionInput } from "./types";
import { Mission } from "@/types/types";
import { getSupaMissionById } from "./queryMissions";
import { isValidUUID } from "./utils";

/**
 * Créer une nouvelle mission dans Supabase
 * @param data Les données de la mission à créer
 * @returns La mission créée ou undefined en cas d'erreur
 */
export const createSupaMission = async (data: MissionInput): Promise<Mission | undefined> => {
  try {
    console.log("Création d'une mission dans Supabase:", data);

    // Préparer les données pour l'insertion
    const missionData = {
      name: data.name,
      client: data.client,
      description: data.description,
      sdr_id: data.sdrId || null,
      start_date: data.startDate || new Date(),
    };

    // Insérer la mission dans Supabase
    const { data: newMission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select('id, name, client, description, sdr_id, created_at, start_date')
      .single();

    if (error) {
      console.error("Erreur lors de la création de la mission dans Supabase:", error);
      return undefined;
    }

    console.log("Mission créée dans Supabase:", newMission);

    // Récupérer la mission complète pour avoir toutes les relations
    return await getSupaMissionById(newMission.id);
  } catch (error) {
    console.error("Exception lors de la création de la mission dans Supabase:", error);
    return undefined;
  }
};

/**
 * Supprimer une mission dans Supabase
 * @param missionId L'ID de la mission à supprimer
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export const deleteSupaMission = async (
  missionId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log("Suppression d'une mission dans Supabase:", missionId);
    
    // Vérifier si l'ID est un UUID valide
    if (!isValidUUID(missionId)) {
      console.error("ID de mission invalide pour Supabase:", missionId);
      return { success: false, error: "ID de mission invalide" };
    }
    
    // Vérifier si la mission existe avant de la supprimer
    const missionExists = await getSupaMissionById(missionId);
    if (!missionExists) {
      console.error("Mission introuvable dans Supabase:", missionId);
      return { success: false, error: "Mission introuvable" };
    }
    
    // Supprimer les relations de la mission d'abord si nécessaire
    // (Si vous avez des tables liées avec des contraintes de clé étrangère)
    
    // Supprimer la mission
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error("Erreur lors de la suppression de la mission dans Supabase:", error);
      return { success: false, error };
    }

    console.log("Mission supprimée avec succès dans Supabase:", missionId);
    return { success: true };
  } catch (error) {
    console.error("Exception lors de la suppression de la mission dans Supabase:", error);
    return { success: false, error };
  }
};

/**
 * Assigner un SDR à une mission dans Supabase
 * @param missionId L'ID de la mission
 * @param sdrId L'ID du SDR à assigner
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export const assignSDRToSupaMission = async (
  missionId: string,
  sdrId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log(`Assignation du SDR ${sdrId} à la mission ${missionId} dans Supabase`);
    
    // Vérifier si les ID sont des UUID valides
    if (!isValidUUID(missionId) || !isValidUUID(sdrId)) {
      console.error("ID de mission ou de SDR invalide pour Supabase");
      return { success: false, error: "ID de mission ou de SDR invalide" };
    }
    
    // Mettre à jour la mission avec le nouveau SDR
    const { error } = await supabase
      .from('missions')
      .update({ sdr_id: sdrId })
      .eq('id', missionId);

    if (error) {
      console.error("Erreur lors de l'assignation du SDR dans Supabase:", error);
      return { success: false, error };
    }

    console.log("SDR assigné avec succès dans Supabase");
    return { success: true };
  } catch (error) {
    console.error("Exception lors de l'assignation du SDR dans Supabase:", error);
    return { success: false, error };
  }
};
