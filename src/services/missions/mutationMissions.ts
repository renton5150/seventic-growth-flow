
import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "./utils";
import { MissionInput, DeletionResult, AssignmentResult } from "./types";

/**
 * Créer une nouvelle mission dans Supabase
 * @param data Mission input data
 * @returns Promise<Mission | undefined> The created mission or undefined on failure
 */
export const createSupaMission = async (data: MissionInput): Promise<Mission | undefined> => {
  try {
    // Vérifier que l'utilisateur est authentifié
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("Erreur: Utilisateur non authentifié pour créer une mission");
      return undefined;
    }
    
    console.log("Création d'une nouvelle mission dans Supabase:", data);
    console.log("Session active:", !!session.session);
    
    // Vérifier et valider l'ID du SDR
    let sdrId = data.sdrId;
    if (!isValidUUID(sdrId)) {
      // Si ce n'est pas un UUID valide, utilisez l'ID de l'utilisateur authentifié
      sdrId = session.session?.user?.id || "";
      console.log(`ID SDR non valide, utilisation de l'ID utilisateur actuel: ${sdrId}`);
      
      if (!isValidUUID(sdrId)) {
        console.error("Impossible d'obtenir un UUID valide pour le SDR");
        return undefined;
      }
    }
    
    const missionData = {
      name: data.name,
      description: data.description || null,
      sdr_id: sdrId,
      start_date: data.startDate.toISOString(),
      client: "Default Client" // Adding a default client name
    };

    console.log("Données de mission à insérer:", missionData);

    const { data: newMission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select(`
        id, 
        name, 
        client, 
        description, 
        sdr_id, 
        created_at, 
        start_date,
        profiles(name)
      `)
      .single();

    if (error) {
      console.error("Erreur lors de la création de la mission:", error);
      return undefined;
    }

    console.log("Nouvelle mission créée dans Supabase:", newMission);

    return {
      id: newMission.id,
      name: newMission.name,
      client: newMission.client,
      description: newMission.description || undefined,
      sdrId: newMission.sdr_id || "",
      sdrName: newMission.profiles?.name || "Inconnu",
      createdAt: new Date(newMission.created_at),
      startDate: new Date(newMission.start_date || newMission.created_at),
      requests: []
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return undefined;
  }
};

/**
 * Supprimer une mission dans Supabase
 * @param missionId ID of the mission to delete
 * @returns Promise<DeletionResult> Result of the deletion operation
 */
export const deleteSupaMission = async (missionId: string): Promise<DeletionResult> => {
  try {
    console.log("Suppression d'une mission dans Supabase avec ID:", missionId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner false
    if (!isValidUUID(missionId)) {
      console.warn(`ID mission non valide pour Supabase: ${missionId}`);
      return {
        success: false,
        error: "Invalid mission ID format"
      };
    }
    
    // Vérifier l'authentification actuelle
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("Erreur: Utilisateur non authentifié pour supprimer une mission");
      return {
        success: false,
        error: "User not authenticated"
      };
    }
    
    // Première étape : supprimer tous les requests liés à cette mission
    const { error: requestsError } = await supabase
      .from('requests')
      .delete()
      .eq('mission_id', missionId);
      
    if (requestsError) {
      console.error("Erreur lors de la suppression des demandes liées à la mission:", requestsError);
      // Continue quand même avec la suppression de la mission
    }
    
    // Deuxième étape : supprimer la mission elle-même
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error("Erreur Supabase lors de la suppression de la mission:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log(`Mission ${missionId} supprimée avec succès dans Supabase`);
    return {
      success: true
    };
  } catch (error) {
    console.error("Exception lors de la suppression de la mission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Assigner un SDR à une mission dans Supabase
 * @param missionId ID of the mission to update
 * @param sdrId ID of the SDR to assign
 * @returns Promise<AssignmentResult> Result of the assignment operation
 */
export const assignSDRToSupaMission = async (missionId: string, sdrId: string): Promise<AssignmentResult> => {
  try {
    console.log("Assignation d'un SDR à une mission dans Supabase:", missionId, sdrId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner false
    if (!isValidUUID(missionId) || !isValidUUID(sdrId)) {
      console.warn("ID mission ou SDR non valide pour Supabase:", { missionId, sdrId });
      return {
        success: false,
        error: "Invalid mission ID or SDR ID format"
      };
    }
    
    const { error } = await supabase
      .from('missions')
      .update({ sdr_id: sdrId })
      .eq('id', missionId);

    if (error) {
      console.error("Erreur lors de l'assignation du SDR:", error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log("SDR assigné avec succès dans Supabase");
    return {
      success: true
    };
  } catch (error) {
    console.error("Erreur inattendue lors de l'assignation du SDR:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
