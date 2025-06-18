
import { supabase } from "@/integrations/supabase/client";
import { Mission, MissionType } from "@/types/types";
import { getMissionName, clearMissionNameCache, forceRefreshFreshworks, isFreshworksId } from "@/services/missionNameService";

// Simple function to check if a mission exists by ID
export const checkMissionExists = async (missionId: string): Promise<boolean> => {
  if (!missionId) return false;
  
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('id')
      .eq('id', missionId)
      .single();
      
    if (error || !data) {
      console.error("Error checking mission existence:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in checkMissionExists:", error);
    return false;
  }
};

// Get all missions from Supabase
export const getAllSupaMissions = async () => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*');
      
    if (error) {
      console.error("Error fetching all missions:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getAllSupaMissions:", error);
    return [];
  }
};

// Get missions by user ID
export const getSupaMissionsByUserId = async (userId: string) => {
  try {
    console.log(`[getSupaMissionsByUserId] Récupération des missions pour l'utilisateur ${userId}`);
    
    // Forcer le rafraîchissement de Freshworks pour s'assurer qu'il est bien dans le cache
    forceRefreshFreshworks();
    
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('sdr_id', userId);
      
    if (error) {
      console.error(`Error fetching missions for user ${userId}:`, error);
      return [];
    }
    
    // Convertir les données brutes en objets Mission avec noms standardisés
    const missionsWithNames = await Promise.all(
      (data || []).map(mission => mapSupaMissionToMission(mission))
    );
    
    console.log(`[getSupaMissionsByUserId] ${missionsWithNames.length} missions récupérées et formatées`);
    
    // Log pour vérifier si Freshworks est présent
    const freshworks = missionsWithNames.find(m => 
      isFreshworksId(m.id) || 
      m.name === "Freshworks"
    );
    if (freshworks) {
      console.log("[getSupaMissionsByUserId] Mission Freshworks trouvée:", freshworks);
    }
    
    return missionsWithNames;
  } catch (error) {
    console.error("[getSupaMissionsByUserId] Error retrieving user missions:", error);
    return [];
  }
};

// Get a single mission by ID
export const getSupaMissionById = async (missionId: string) => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();
      
    if (error) {
      console.error(`Error fetching mission ${missionId}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSupaMissionById:", error);
    return null;
  }
};

// Create a new mission
export const createSupaMission = async (missionData: any) => {
  try {
    // Convert mission data to match Supabase column names
    const supabaseMissionData = {
      name: missionData.name,
      sdr_id: missionData.sdrId || null, // Use null if sdrId is empty
      description: missionData.description || "",
      start_date: missionData.startDate ? new Date(missionData.startDate).toISOString() : null,
      end_date: missionData.endDate ? new Date(missionData.endDate).toISOString() : null,
      type: missionData.type || "Full",
      client: missionData.client || missionData.name, // Use name as client if not provided
      status: missionData.status || "En cours",
      objectif_mensuel_rdv: missionData.objectifMensuelRdv || null,
      types_prestation: missionData.typesPrestation ? JSON.stringify(missionData.typesPrestation) : '[]',
      criteres_qualification: missionData.criteresQualification || null,
      interlocuteurs_cibles: missionData.interlocuteursCibles || null,
      login_connexion: missionData.loginConnexion || null
    };
    
    console.log("Formatted data for Supabase insertion:", supabaseMissionData);

    const { data, error } = await supabase
      .from('missions')
      .insert([supabaseMissionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating mission in Supabase:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No data returned after mission creation");
      return null;
    }

    console.log("Mission created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createSupaMission:", error);
    throw error;
  }
};

// Update an existing mission
export const updateSupaMission = async (missionData: any) => {
  try {
    // Format the data to match Supabase column names
    const supabaseMissionData = {
      name: missionData.name,
      sdr_id: missionData.sdrId || null,
      description: missionData.description || "",
      start_date: missionData.startDate ? new Date(missionData.startDate).toISOString() : null,
      end_date: missionData.endDate ? new Date(missionData.endDate).toISOString() : null,
      type: missionData.type || "Full",
      status: missionData.status || "En cours",
      objectif_mensuel_rdv: missionData.objectifMensuelRdv || null,
      types_prestation: missionData.typesPrestation ? JSON.stringify(missionData.typesPrestation) : '[]',
      criteres_qualification: missionData.criteresQualification || null,
      interlocuteurs_cibles: missionData.interlocuteursCibles || null,
      login_connexion: missionData.loginConnexion || null
    };
    
    const { data, error } = await supabase
      .from('missions')
      .update(supabaseMissionData)
      .eq('id', missionData.id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating mission ${missionData.id}:`, error);
      throw error;
    }
    
    // Clear the mission name cache for this mission to ensure updated data is shown
    clearMissionNameCache(missionData.id);
    
    return data;
  } catch (error) {
    console.error("Error in updateSupaMission:", error);
    throw error;
  }
};

/**
 * Maps a Supabase mission data object to the Mission type used in the application
 * with enhanced handling of mission names and client information to ensure consistency
 * between SDR and Growth users - Now using centralized mission name service
 */
export const mapSupaMissionToMission = async (mission: any): Promise<Mission> => {
  // Extract SDR profile information - handle both array and object formats
  // When we join with profiles, Supabase returns it as an object under the relation name
  // or as an array of objects in newer versions of the API
  let sdrProfile = null;
  
  if (mission.profiles) {
    if (Array.isArray(mission.profiles) && mission.profiles.length > 0) {
      sdrProfile = mission.profiles[0];
    } else {
      sdrProfile = mission.profiles;
    }
  }
  
  console.log('Mission mapping - Raw mission data:', {
    id: mission.id,
    name: mission.name,
    client: mission.client
  });

  // Utiliser le service centralisé pour obtenir le nom standardisé
  let displayName: string;
  
  // Cas spécial pour Freshworks - vérification unifiée
  if (isFreshworksId(mission.id)) {
    displayName = "Freshworks";
    console.log(`[mapSupaMissionToMission] Freshworks détecté: ${mission.id} => "${displayName}"`);
  } else {
    // Utiliser le service centralisé
    displayName = await getMissionName(mission.id, {
      fallbackClient: mission.client,
      fallbackName: mission.name,
      forceRefresh: false
    });
  }
  
  console.log(`[mapSupaMissionToMission] FINAL name chosen: "${displayName}"`);

  // Parse typesPrestation from jsonb to array
  let typesPrestation: string[] = [];
  if (mission.types_prestation) {
    try {
      if (typeof mission.types_prestation === 'string') {
        typesPrestation = JSON.parse(mission.types_prestation);
      } else if (Array.isArray(mission.types_prestation)) {
        typesPrestation = mission.types_prestation;
      }
    } catch (error) {
      console.error("Erreur lors du parsing de types_prestation:", error);
      typesPrestation = [];
    }
  }

  return {
    id: mission.id,
    name: displayName,
    description: mission.description || '',
    sdrId: mission.sdr_id || null,
    sdrName: sdrProfile?.name || null,
    createdAt: new Date(mission.created_at),
    startDate: mission.start_date ? new Date(mission.start_date) : null,
    endDate: mission.end_date ? new Date(mission.end_date) : null,
    type: (mission.type as MissionType) || 'Full',
    status: mission.status === "Fin" ? "Fin" : "En cours",
    client: displayName, // Using the same standardized name for client to ensure consistency
    requests: [],
    objectifMensuelRdv: mission.objectif_mensuel_rdv || '',
    typesPrestation: typesPrestation,
    criteresQualification: mission.criteres_qualification || '',
    interlocuteursCibles: mission.interlocuteurs_cibles || '',
    loginConnexion: mission.login_connexion || ''
  };
};
