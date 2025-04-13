
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
  
  try {
    // Vérification de l'existence de la mission
    const response = await safeSupabase
      .from("missions")
      .select("id, sdr_id, type, status")
      .eq("id", mission.id)
      .maybeSingle();
    
    if (response.error) {
      console.error("Erreur lors de la vérification de l'existence:", response.error);
      throw new Error(`Erreur lors de la vérification: ${response.error.message}`);
    }
    
    // Vérifier si les données existent
    if (!response.data) {
      console.error("Mission introuvable:", mission.id);
      throw new Error("La mission n'existe pas");
    }
    
    // Maintenant que nous savons que data existe, nous pouvons l'utiliser en toute sécurité
    const existingMission = response.data as unknown as SupabaseMissionData;
    
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
    
    const updateResponse = await safeSupabase
      .from("missions")
      .update(supabaseData)
      .eq("id", mission.id)
      .select()
      .single();
    
    if (updateResponse.error) {
      console.error("Erreur Supabase lors de la mise à jour:", updateResponse.error);
      // Ajouter des informations détaillées sur l'erreur
      if (updateResponse.error.code === "42501") {
        throw new Error(`Erreur de permission: ${updateResponse.error.message} (RLS a refusé l'accès)`);
      } else if (updateResponse.error.code === "23505") {
        throw new Error(`Conflit de clé unique: ${updateResponse.error.message}`);
      } else if (updateResponse.error.code === "23503") {
        throw new Error(`Violation de contrainte de clé étrangère: ${updateResponse.error.message} (sdr_id non valide)`);
      } else {
        throw new Error(`Erreur Supabase [${updateResponse.error.code}]: ${updateResponse.error.message}`);
      }
    }
    
    if (!updateResponse.data) {
      throw new Error("Aucune donnée retournée après la mise à jour");
    }
    
    console.log("Réponse de Supabase après mise à jour:", updateResponse.data);
    
    // Convertir explicitement le résultat avant d'utiliser ses propriétés
    const updatedMissionData = updateResponse.data as unknown as SupabaseMissionData;
    
    // Verify sdr_id was properly saved
    if (!updatedMissionData.sdr_id) {
      console.error("sdr_id manquant dans les données retournées après mise à jour:", updatedMissionData);
    }
    
    return mapSupaMissionToMission(updatedMissionData);
  } catch (error: any) {
    console.error("Erreur dans updateSupaMission:", error);
    throw error;
  }
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
  const verificationResponse = await safeSupabase
    .from("missions")
    .select("id")
    .eq("id", missionId)
    .maybeSingle();
  
  if (verificationResponse.error) {
    console.error("Erreur lors de la vérification après suppression:", verificationResponse.error);
  }
  
  if (verificationResponse.data) {
    console.error("La mission existe toujours après suppression");
    throw new Error("Échec de la suppression: la mission existe toujours");
  }
  
  console.log("Mission supprimée avec succès");
  return true;
};
