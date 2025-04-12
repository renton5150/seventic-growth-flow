
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "./utils";
import { checkMissionExists } from "./getMissions";
import { compareIds } from "@/utils/permissionUtils";

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
    .select("id, sdr_id")
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
  
  // Vérifier la concordance des IDs pour le debug
  const idsComparison = compareIds(existingMission.sdr_id, mission.sdrId);
  console.log("Comparaison des IDs:", idsComparison);
  
  // Get current user for debug
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError && session) {
    console.log("Session utilisateur actuelle:", session.user.id);
    console.log("Comparaison avec sdr_id:", compareIds(session.user.id, existingMission.sdr_id));
  } else {
    console.error("Impossible de récupérer la session utilisateur:", sessionError);
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
    client: mission.name // Utilise le nom comme valeur pour client (requis par le schéma)
  };
  
  console.log("Données formatées pour mise à jour Supabase:", supabaseData);
  console.log("SDR ID qui sera mis à jour:", supabaseData.sdr_id);
  
  // Ajouter des logs détaillés pour le debug
  console.log("Requête Supabase: .from('missions').update(données).eq('id', mission.id)");
  console.log("ID de la mission pour la mise à jour:", mission.id);
  
  const { data, error } = await supabase
    .from("missions")
    .update(supabaseData)
    .eq("id", mission.id)
    .select()
    .single();
  
  if (error) {
    console.error("Erreur Supabase lors de la mise à jour:", error);
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
  
  // Get current user for debug
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError && session) {
    console.log("Session utilisateur actuelle pour suppression:", session.user.id);
    
    // Fetch mission details for comparison
    const { data: mission } = await supabase
      .from("missions")
      .select("sdr_id")
      .eq("id", missionId)
      .single();
    
    if (mission) {
      console.log("Comparaison pour suppression:", compareIds(session.user.id, mission.sdr_id));
    }
  }
  
  // Delete the mission
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);
  
  if (error) {
    console.error("Erreur lors de la suppression:", error);
    // Ajouter des informations détaillées sur l'erreur
    if (error.code === "42501") {
      throw new Error(`Erreur de permission: ${error.message} (RLS a refusé l'accès)`);
    } else {
      throw new Error(`Erreur lors de la suppression [${error.code}]: ${error.message}`);
    }
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
