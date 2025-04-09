import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "./utils";

/**
 * Créer une nouvelle mission dans Supabase
 */
export const createSupaMission = async (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate: Date;
}): Promise<Mission | undefined> => {
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
 */
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  try {
    console.log("*** deleteSupaMission: Début de la fonction");
    console.log("Suppression d'une mission dans Supabase avec ID:", missionId);
    console.log("Type de l'ID:", typeof missionId);
    console.log("Longueur de l'ID:", missionId.length);
    
    // Si l'identifiant n'est pas un UUID valide, retourner false
    if (!isValidUUID(missionId)) {
      console.warn(`ID mission non valide pour Supabase: ${missionId}`);
      return false;
    } else {
      console.log(`ID mission validé comme UUID valide: ${missionId}`);
    }
    
    // Vérifier l'authentification actuelle
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("Erreur: Utilisateur non authentifié pour supprimer une mission");
      return false;
    } else {
      console.log(`Utilisateur authentifié avec ID: ${session.session.user.id} pour supprimer la mission ${missionId}`);
    }
    
    console.log("Session active pour suppression:", !!session.session);
    console.log("User ID:", session.session?.user?.id);
    console.log("Tentative de suppression pour la mission:", missionId);
    
    // Modifier cette requête pour ne pas utiliser select('count')
    console.log(`Exécution de la requête DELETE sur la table 'missions' avec id=${missionId}...`);
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    // Vérifier s'il y a eu une erreur
    if (error) {
      console.error("Erreur Supabase lors de la suppression de la mission:", error);
      console.error("Code d'erreur:", error.code);
      console.error("Message d'erreur:", error.message);
      console.error("Détails:", error.details);
      return false;
    }
    
    // Essayons de vérifier si la mission existe encore après suppression
    const { data: checkMission, error: checkError } = await supabase
      .from('missions')
      .select('id')
      .eq('id', missionId)
      .single();
      
    if (checkError && checkError.code === 'PGRST116') {
      console.log(`Vérification confirmée: Mission ${missionId} n'existe plus dans la base de données`);
    } else if (checkMission) {
      console.error(`Échec de la suppression: Mission ${missionId} existe encore dans la base de données`);
      return false;
    }
    
    // Si pas d'erreur, la suppression a réussi
    console.log(`Mission ${missionId} supprimée avec succès dans Supabase`);
    console.log("*** deleteSupaMission: Fin de la fonction avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la mission:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return false;
  }
};

/**
 * Assigner un SDR à une mission dans Supabase
 */
export const assignSDRToSupaMission = async (missionId: string, sdrId: string): Promise<boolean> => {
  try {
    console.log("Assignation d'un SDR à une mission dans Supabase:", missionId, sdrId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner false
    if (!isValidUUID(missionId) || !isValidUUID(sdrId)) {
      console.warn("ID mission ou SDR non valide pour Supabase:", { missionId, sdrId });
      return false;
    }
    
    const { error } = await supabase
      .from('missions')
      .update({ sdr_id: sdrId })
      .eq('id', missionId);

    if (error) {
      console.error("Erreur lors de l'assignation du SDR:", error);
      return false;
    }

    console.log("SDR assigné avec succès dans Supabase");
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de l'assignation du SDR:", error);
    return false;
  }
};
