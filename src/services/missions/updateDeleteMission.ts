
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
  console.log("[updateSupaMission] updateDeleteMission - Données reçues:", JSON.stringify(mission, null, 2));
  
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
  
  // Prepare data for Supabase - preserve empty strings instead of converting to null
  const supabaseData = {
    name: mission.name,
    sdr_id: mission.sdrId,
    description: mission.description !== undefined ? mission.description : "",
    start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
    end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
    type: mission.type || "Full",
    status: mission.status || "En cours",
    client: mission.name, // Utilise le nom comme valeur pour client (requis par le schéma)
    // Preserve empty strings - these are the problematic fields
    objectif_mensuel_rdv: mission.objectifMensuelRdv !== undefined ? mission.objectifMensuelRdv : "",
    types_prestation: mission.typesPrestation ? JSON.stringify(mission.typesPrestation) : '[]',
    criteres_qualification: mission.criteresQualification !== undefined ? mission.criteresQualification : "",
    interlocuteurs_cibles: mission.interlocuteursCibles !== undefined ? mission.interlocuteursCibles : "",
    login_connexion: mission.loginConnexion !== undefined ? mission.loginConnexion : ""
  };
  
  console.log("[updateSupaMission] updateDeleteMission - Données formatées:", JSON.stringify(supabaseData, null, 2));
  console.log("[updateSupaMission] updateDeleteMission - Vérification des champs critiques:", {
    objectif_mensuel_rdv: {
      original: mission.objectifMensuelRdv,
      formatted: supabaseData.objectif_mensuel_rdv,
      type: typeof supabaseData.objectif_mensuel_rdv
    },
    criteres_qualification: {
      original: mission.criteresQualification,
      formatted: supabaseData.criteres_qualification,
      type: typeof supabaseData.criteres_qualification
    },
    interlocuteurs_cibles: {
      original: mission.interlocuteursCibles,
      formatted: supabaseData.interlocuteurs_cibles,
      type: typeof supabaseData.interlocuteurs_cibles
    },
    login_connexion: {
      original: mission.loginConnexion,
      formatted: supabaseData.login_connexion,
      type: typeof supabaseData.login_connexion
    }
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
  
  console.log("[updateSupaMission] updateDeleteMission - Réponse Supabase:", JSON.stringify(data, null, 2));
  console.log("[updateSupaMission] updateDeleteMission - Champs sauvegardés:", {
    objectif_mensuel_rdv: data.objectif_mensuel_rdv,
    criteres_qualification: data.criteres_qualification,
    interlocuteurs_cibles: data.interlocuteurs_cibles,
    login_connexion: data.login_connexion,
    types_prestation: data.types_prestation
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
