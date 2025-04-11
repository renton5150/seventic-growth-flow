import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { getRequestsByMissionId } from "../requestService";
import { v4 as uuidv4 } from "uuid";

// Obtenir toutes les missions depuis Supabase
export const getAllSupaMissions = async (): Promise<Mission[]> => {
  try {
    console.log("Récupération des missions depuis Supabase");
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `);

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      return [];
    }

    console.log("Missions récupérées depuis Supabase:", missions);

    // Adapter les données au format attendu par l'application
    const formattedMissions = await Promise.all(missions.map(async (mission) => {
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client,
        description: mission.description || undefined,
        sdrId: mission.sdr_id || "",
        sdrName: mission.profiles?.name || "Inconnu",
        createdAt: new Date(mission.created_at),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir les missions par utilisateur depuis Supabase
export const getSupaMissionsByUserId = async (userId: string): Promise<Mission[]> => {
  try {
    console.log("Récupération des missions d'utilisateur depuis Supabase pour userId:", userId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner un tableau vide
    if (!isValidUUID(userId)) {
      console.warn("ID utilisateur non valide pour Supabase:", userId);
      return [];
    }
    
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `)
      .eq('sdr_id', userId);

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      return [];
    }

    console.log("Missions utilisateur récupérées depuis Supabase:", missions);

    // Adapter les données au format attendu par l'application
    const formattedMissions = await Promise.all(missions.map(async (mission) => {
      const requests = await getRequestsByMissionId(mission.id);
      
      return {
        id: mission.id,
        name: mission.name,
        client: mission.client,
        description: mission.description || undefined,
        sdrId: mission.sdr_id || "",
        sdrName: mission.profiles?.name || "Inconnu",
        createdAt: new Date(mission.created_at),
        requests
      };
    }));

    return formattedMissions;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des missions:", error);
    return [];
  }
};

// Obtenir une mission par ID depuis Supabase
export const getSupaMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    console.log("Récupération d'une mission depuis Supabase par ID:", missionId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner undefined
    if (!isValidUUID(missionId)) {
      console.warn("ID mission non valide pour Supabase:", missionId);
      return undefined;
    }
    
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
      `)
      .eq('id', missionId)
      .maybeSingle();

    if (error || !mission) {
      console.error("Erreur lors de la récupération de la mission:", error);
      return undefined;
    }

    console.log("Mission récupérée depuis Supabase:", mission);

    const requests = await getRequestsByMissionId(mission.id);

    return {
      id: mission.id,
      name: mission.name,
      client: mission.client,
      description: mission.description || undefined,
      sdrId: mission.sdr_id || "",
      sdrName: mission.profiles?.name || "Inconnu",
      createdAt: new Date(mission.created_at),
      requests
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la mission:", error);
    return undefined;
  }
};

// Créer une nouvelle mission dans Supabase
export const createSupaMission = async (data: {
  name: string;
  client: string;
  description?: string;
  sdrId: string;
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
      client: data.client,
      description: data.description || null,
      sdr_id: sdrId
    };

    console.log("Données de mission à insérer:", missionData);

    const { data: newMission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select(`
        *,
        profiles!missions_sdr_id_fkey(name)
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
      requests: []
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la mission:", error);
    return undefined;
  }
};

// Supprimer une mission depuis Supabase
export const deleteSupaMission = async (missionId: string): Promise<boolean> => {
  try {
    console.log("Suppression d'une mission depuis Supabase par ID:", missionId);
    
    // Si l'identifiant n'est pas un UUID valide, retourner false
    if (!isValidUUID(missionId)) {
      console.warn("ID mission non valide pour Supabase:", missionId);
      return false;
    }
    
    // Vérifier que l'utilisateur est authentifié
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("Erreur: Utilisateur non authentifié pour supprimer une mission");
      return false;
    }
    
    // Supprimer la mission
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      return false;
    }

    console.log("Mission supprimée avec succès dans Supabase:", missionId);
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de la mission:", error);
    return false;
  }
};

// Fonction pour vérifier si une chaîne est un UUID valide
const isValidUUID = (str: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};
