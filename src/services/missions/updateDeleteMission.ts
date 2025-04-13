
import { Mission, MissionType, MissionStatus } from "@/types/types";
import { safeSupabase } from "@/integrations/supabase/safeClient";
import { mapSupaMissionToMission } from "./utils";
import { checkMissionExists } from "./getMissions";

// Type d'aide pour contourner les erreurs TypeScript avec les retours Supabase
interface SupabaseMissionData {
  id: string;
  sdr_id: string;
  type: string;
  status: string;
  [key: string]: any; // Permet d'autres propriétés
}

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
  status?: MissionStatus;
  user_role?: string; // Ajout du rôle utilisateur pour la validation côté serveur
}, userRole?: string): Promise<Mission> => {
  console.log("updateSupaMission reçoit:", mission);
  console.log("Rôle de l'utilisateur pour la mise à jour:", userRole || mission.user_role);
  
  // Check if mission exists
  const { data: checkData, error: checkError } = await safeSupabase
    .from("missions")
    .select("id, sdr_id, type, status")
    .eq("id", mission.id)
    .maybeSingle();
  
  if (checkError) {
    console.error("Erreur lors de la vérification de l'existence:", checkError);
    throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
  }
  
  if (!checkData) {
    console.error("Mission introuvable:", mission.id);
    throw new Error("La mission n'existe pas");
  }
  
  // Casting explicite pour éviter les erreurs TypeScript
  const existingMission = checkData as SupabaseMissionData;
  
  // Utiliser le rôle fourni en paramètre ou celui inclus dans l'objet mission
  const effectiveUserRole = userRole || mission.user_role;
  
  // Préparation des données pour Supabase avec protection des champs selon le rôle
  let supabaseData: any = {
    name: mission.name,
    description: mission.description || "",
    start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
    end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
    client: mission.name // Utilise le nom comme valeur pour client (requis par le schéma)
  };
  
  // Protection côté serveur: si l'utilisateur est SDR, conserver la valeur originale
  if (effectiveUserRole === 'sdr') {
    console.log("Utilisateur SDR: conservation des valeurs originales pour sdr_id, type");
    // Un SDR ne peut modifier que le statut de ses propres missions
    if (existingMission.sdr_id === mission.sdrId) {
      supabaseData.status = mission.status || existingMission.status;
      console.log("SDR modifiant sa propre mission, statut mis à jour à:", supabaseData.status);
    } else {
      supabaseData.status = existingMission.status;
    }
    // Utiliser les valeurs existantes pour les champs restreints
    supabaseData.sdr_id = existingMission.sdr_id;
    supabaseData.type = existingMission.type;
  } else {
    // Admin peut modifier tous les champs
    supabaseData.sdr_id = mission.sdrId;
    supabaseData.type = mission.type || "Full";
    supabaseData.status = mission.status || existingMission.status;
    console.log("Administrateur: mise à jour de tous les champs, statut à", supabaseData.status);
  }
  
  console.log("Données formatées pour mise à jour Supabase:", supabaseData);
  
  const { data: updatedData, error } = await safeSupabase
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
  
  if (!updatedData) {
    throw new Error("Aucune donnée retournée après la mise à jour");
  }
  
  console.log("Réponse de Supabase après mise à jour:", updatedData);
  
  // Verify sdr_id was properly saved
  if (!updatedData.sdr_id) {
    console.error("sdr_id manquant dans les données retournées après mise à jour:", updatedData);
  }
  
  return mapSupaMissionToMission(updatedData);
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
  const { error } = await safeSupabase
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
  const { data: checkAfterDelete, error: verifyError } = await safeSupabase
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
