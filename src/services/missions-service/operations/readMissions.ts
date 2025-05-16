
import { Mission, MissionType } from "@/types/types";
import { isSupabaseConfigured } from "@/services/missions/config";
import { isSupabaseAuthenticated } from "../auth/supabaseAuth";
import { mapSupaMissionToMission } from "@/services/missions/utils";
import { supabase } from "@/integrations/supabase/client";

// Function to get all missions with SDR information
export const getAllMissionsFromSupabase = async (): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return [];
    }

    // Use a JOIN to get SDR profile information with the mission
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching missions from Supabase:", error);
      return [];
    }

    console.log("Missions retrieved with SDR data:", missions);
    return missions.map(mission => mapSupaMissionToMission(mission));
  } catch (error) {
    console.error("Error fetching missions from Supabase:", error);
    return [];
  }
};

// Function to get missions by SDR ID with SDR information
export const getMissionsBySdrId = async (userId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !userId) {
      console.log("Supabase not configured, user not authenticated, or invalid user ID");
      return [];
    }

    // Use a JOIN to get SDR profile information with the mission
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .eq('sdr_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user missions from Supabase:", error);
      return [];
    }

    console.log("User missions retrieved with SDR data:", missions);
    return missions.map(mission => mapSupaMissionToMission(mission));
  } catch (error) {
    console.error("Error fetching user missions from Supabase:", error);
    return [];
  }
};

// Alias function for backward compatibility
export const getMissionsByUserId = getMissionsBySdrId;

// Fixed implementation of getMissionsByGrowthId with improved error handling and logging
export const getMissionsByGrowthId = async (growthId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !growthId) {
      console.log("Supabase not configured, user not authenticated, or invalid growth ID");
      return [];
    }

    console.log(`DEBUG - Récupération missions pour Growth ID: ${growthId}`);

    // Improved query with better column specification and proper join syntax
    const { data: missions, error } = await supabase
      .from('missions')
      .select(`
        id,
        name,
        client,
        description,
        sdr_id,
        growth_id,
        type,
        status,
        start_date,
        end_date,
        created_at,
        updated_at,
        profiles!sdr_id (id, name, email)
      `)
      .eq('growth_id', growthId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des missions pour Growth ID ${growthId}:`, error);
      
      // Fallback query if the first one fails - try without the join
      console.log("Tentative de récupération sans jointure...");
      const { data: fallbackMissions, error: fallbackError } = await supabase
        .from('missions')
        .select('*')
        .eq('growth_id', growthId)
        .order('created_at', { ascending: false });
        
      if (fallbackError || !fallbackMissions || fallbackMissions.length === 0) {
        console.error("Échec de la récupération, même sans jointure:", fallbackError);
        return [];
      }
      
      console.log(`Récupération sans jointure réussie: ${fallbackMissions.length} missions trouvées`);
      return fallbackMissions.map(mission => mapSupaMissionToMission(mission));
    }

    if (!missions || missions.length === 0) {
      console.log(`ATTENTION - Aucune mission associée au Growth ID ${growthId}`);
      
      // Pour le débogage, vérifions si des missions existent avec ce growth_id
      const { data: allMissions } = await supabase
        .from('missions')
        .select('id, name, client, growth_id')
        .limit(20);
        
      console.log("DEBUG - Échantillon des missions disponibles:", allMissions);
      
      // Tenter une recherche alternative si aucune mission n'a été trouvée
      console.log("Tentative de récupération de toutes les missions (limité à 50)...");
      const { data: alternateMissions } = await supabase
        .from('missions')
        .select('*')
        .limit(50);
        
      if (alternateMissions && alternateMissions.length > 0) {
        console.log(`DEBUG - ${alternateMissions.length} missions trouvées au total dans la base`);
        
        // Vérifier si le growth_id existe dans l'une de ces missions
        const growthMissions = alternateMissions.filter(m => m.growth_id === growthId);
        if (growthMissions.length > 0) {
          console.log(`DEBUG - ${growthMissions.length} missions trouvées par recherche alternative`);
          return growthMissions.map(mission => mapSupaMissionToMission(mission));
        }
      }
      
      return [];
    }
    
    console.log(`SUCCÈS - ${missions.length} missions trouvées pour Growth ID ${growthId}`);
    
    // Mapper les données de mission au format attendu avec gestion améliorée des noms
    const mappedMissions = missions.map(mission => {
      // Get profile data from the joined profiles table - handle both object and array formats
      const profileData = mission.profiles ? (
        Array.isArray(mission.profiles) ? mission.profiles[0] : mission.profiles
      ) : null;
      
      // Improved mission name handling - prioritize client name if available
      const missionName = mission.client && mission.client !== mission.name 
        ? mission.client 
        : (mission.name || `Mission ${mission.id.substring(0, 6)}`);
      
      const mappedMission: Mission = {
        id: mission.id,
        name: mission.name || `Mission ${mission.id.substring(0, 6)}`,
        sdrId: mission.sdr_id || "",
        description: mission.description || "",
        createdAt: new Date(mission.created_at),
        sdrName: profileData?.name || "À déterminer",
        requests: [],
        startDate: mission.start_date ? new Date(mission.start_date) : new Date(),
        endDate: mission.end_date ? new Date(mission.end_date) : null,
        type: mission.type as MissionType || "Full",
        // Ensure status is one of the allowed values, defaulting to "En cours" if not
        status: mission.status === "Fin" ? "Fin" : "En cours",
        client: mission.client || mission.name || ""
      };
      
      console.log(`Mission mappée: ID=${mappedMission.id}, Nom=${mappedMission.name}, Client=${mappedMission.client}`);
      return mappedMission;
    });
    
    return mappedMissions;
  } catch (error) {
    console.error(`Erreur lors de la récupération des missions pour Growth ID ${growthId}:`, error);
    return [];
  }
};

export const getMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !missionId) {
      console.log("Supabase not configured, user not authenticated, or invalid mission ID");
      return undefined;
    }

    // Use a JOIN to get SDR profile information with the mission
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        profiles:sdr_id (id, name, email)
      `)
      .eq('id', missionId)
      .single();

    if (error) {
      console.error("Error fetching mission from Supabase:", error);
      return undefined;
    }

    return mission ? mapSupaMissionToMission(mission) : undefined;
  } catch (error) {
    console.error("Error fetching mission from Supabase:", error);
    return undefined;
  }
};
