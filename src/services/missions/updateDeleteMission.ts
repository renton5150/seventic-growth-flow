
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "./utils";
import { checkMissionExists } from "./getMissions";

/**
 * Mettre à jour une mission existante
 */
export const updateSupaMission = async (mission: {
  id: string;
  name: string;
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
    sdr_id: mission.sdrId,
    description: mission.description || "",
    start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
    end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
    type: mission.type || "Full",
    // Add a dummy client field temporarily to satisfy TypeScript
    client: "placeholder"
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

/**
 * Supprimer une mission
 */
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  console.log("Suppression de mission dans Supabase. ID:", missionId);
  
  // Check if mission exists
  const exists = await checkMissionExists(missionId);
  
  if (!exists) {
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
