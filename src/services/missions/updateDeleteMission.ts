
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
  status?: "En cours" | "Fin";
  objectifMensuelRdv?: string;
  typesPrestation?: string[];
  criteresQualification?: string;
  interlocuteursCibles?: string;
  loginConnexion?: string;
}): Promise<Mission> => {
  console.log("updateSupaMission reçoit:", mission);
  console.log("Status à mettre à jour:", mission.status);
  
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
    status: mission.status || "En cours",
    client: mission.name, // Utilise le nom comme valeur pour client (requis par le schéma)
    objectif_mensuel_rdv: mission.objectifMensuelRdv || null,
    types_prestation: mission.typesPrestation ? JSON.stringify(mission.typesPrestation) : '[]',
    criteres_qualification: mission.criteresQualification || null,
    interlocuteurs_cibles: mission.interlocuteursCibles || null,
    login_connexion: mission.loginConnexion || null
  };
  
  console.log("Données formatées pour mise à jour Supabase:", supabaseData);
  console.log("SDR ID qui sera mis à jour:", supabaseData.sdr_id);
  console.log("Status qui sera mis à jour:", supabaseData.status);
  console.log("Nouveaux champs qui seront mis à jour:", {
    objectif_mensuel_rdv: supabaseData.objectif_mensuel_rdv,
    types_prestation: supabaseData.types_prestation,
    criteres_qualification: supabaseData.criteres_qualification,
    interlocuteurs_cibles: supabaseData.interlocuteurs_cibles,
    login_connexion: supabaseData.login_connexion
  });
  
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
  console.log("Status retourné après mise à jour:", data.status);
  console.log("Nouveaux champs retournés après mise à jour:", {
    objectif_mensuel_rdv: data.objectif_mensuel_rdv,
    types_prestation: data.types_prestation,
    criteres_qualification: data.criteres_qualification,
    interlocuteurs_cibles: data.interlocuteurs_cibles,
    login_connexion: data.login_connexion
  });
  
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
