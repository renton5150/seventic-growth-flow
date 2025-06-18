
import { supabase } from "@/integrations/supabase/client";
import { Mission, MissionType, TypePrestation } from "@/types/types";
import { getMissionName, clearMissionNameCache, forceRefreshFreshworks, isFreshworksId } from "@/services/missionNameService";

// Simple function to check if a mission exists by ID with retry logic
export const checkMissionExists = async (missionId: string, retries: number = 3): Promise<boolean> => {
  if (!missionId) return false;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('id')
        .eq('id', missionId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error(`Error checking mission existence (attempt ${attempt}):`, error);
        if (attempt === retries) return false;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return !!data;
    } catch (error) {
      console.error(`Exception in checkMissionExists (attempt ${attempt}):`, error);
      if (attempt === retries) return false;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
};

// Get all missions from Supabase with retry logic
export const getAllSupaMissions = async (retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[getAllSupaMissions] Tentative ${attempt}/${retries}`);
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error(`Error fetching all missions (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(`Impossible de charger les missions après ${retries} tentatives: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      console.log(`[getAllSupaMissions] ${data?.length || 0} missions récupérées`);
      return data || [];
    } catch (error) {
      console.error(`Exception in getAllSupaMissions (attempt ${attempt}):`, error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return [];
};

// Get missions by user ID with retry logic
export const getSupaMissionsByUserId = async (userId: string, retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[getSupaMissionsByUserId] Récupération des missions pour l'utilisateur ${userId} (tentative ${attempt})`);
      
      // Forcer le rafraîchissement de Freshworks pour s'assurer qu'il est bien dans le cache
      forceRefreshFreshworks();
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('sdr_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error(`Error fetching missions for user ${userId} (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(`Impossible de charger les missions utilisateur après ${retries} tentatives: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
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
      console.error(`[getSupaMissionsByUserId] Error retrieving user missions (attempt ${attempt}):`, error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return [];
};

// Get a single mission by ID with retry logic
export const getSupaMissionById = async (missionId: string, retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Mission not found
        }
        console.error(`Error fetching mission ${missionId} (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(`Impossible de charger la mission après ${retries} tentatives: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return data;
    } catch (error) {
      console.error(`Exception in getSupaMissionById (attempt ${attempt}):`, error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null;
};

// Create a new mission with improved error handling
export const createSupaMission = async (missionData: any) => {
  try {
    // Convert mission data to match Supabase column names
    const supabaseMissionData = {
      name: missionData.name,
      sdr_id: missionData.sdrId || null,
      description: missionData.description || "",
      start_date: missionData.startDate ? new Date(missionData.startDate).toISOString() : null,
      end_date: missionData.endDate ? new Date(missionData.endDate).toISOString() : null,
      type: missionData.type || "Full",
      client: missionData.client || missionData.name,
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
      throw new Error(`Erreur lors de la création de la mission: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Aucune donnée retournée après la création de la mission");
    }

    console.log("Mission created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createSupaMission:", error);
    throw error;
  }
};

// Update an existing mission with improved error handling
export const updateSupaMission = async (missionData: any) => {
  try {
    console.log("[updateSupaMission] Mise à jour de la mission:", missionData.id);
    
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
    
    console.log("[updateSupaMission] Données formatées:", supabaseMissionData);
    
    const { data, error } = await supabase
      .from('missions')
      .update(supabaseMissionData)
      .eq('id', missionData.id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating mission ${missionData.id}:`, error);
      throw new Error(`Erreur lors de la mise à jour de la mission: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Aucune donnée retournée après la mise à jour de la mission");
    }
    
    // Clear the mission name cache for this mission to ensure updated data is shown
    clearMissionNameCache(missionData.id);
    
    console.log("[updateSupaMission] Mission mise à jour avec succès:", data);
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

  // Parse and validate typesPrestation from jsonb to array
  let typesPrestation: TypePrestation[] = [];
  if (mission.types_prestation) {
    try {
      let prestationArray: string[] = [];
      if (typeof mission.types_prestation === 'string') {
        prestationArray = JSON.parse(mission.types_prestation);
      } else if (Array.isArray(mission.types_prestation)) {
        prestationArray = mission.types_prestation;
      }
      
      // Validate each string against TypePrestation union type
      const validPrestations: TypePrestation[] = ["Call", "Email marketing", "Cold email", "Social selling"];
      typesPrestation = prestationArray.filter((item): item is TypePrestation => 
        validPrestations.includes(item as TypePrestation)
      );
    } catch (error) {
      console.error("Erreur lors du parsing de types_prestation:", error);
      typesPrestation = [];
    }
  }

  console.log(`[mapSupaMissionToMission] Mapping des champs texte pour mission ${mission.id}:`, {
    objectif_mensuel_rdv: mission.objectif_mensuel_rdv,
    criteres_qualification: mission.criteres_qualification,
    interlocuteurs_cibles: mission.interlocuteurs_cibles,
    login_connexion: mission.login_connexion
  });

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
    client: displayName,
    requests: [],
    // Preserve empty strings instead of converting to null/undefined
    objectifMensuelRdv: mission.objectif_mensuel_rdv ?? '',
    typesPrestation: typesPrestation,
    criteresQualification: mission.criteres_qualification ?? '',
    interlocuteursCibles: mission.interlocuteurs_cibles ?? '',
    loginConnexion: mission.login_connexion ?? ''
  };
};
