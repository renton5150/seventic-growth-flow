
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

// Implémentation améliorée de getMissionsByGrowthId
export const getMissionsByGrowthId = async (growthId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !growthId) {
      console.log("Supabase not configured, user not authenticated, or invalid growth ID");
      return [];
    }

    console.log(`DEBUG - Récupération missions pour Growth ID: ${growthId}`);

    // Récupérer directement les missions depuis la table missions avec tous les détails
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
        profiles:sdr_id (id, name, email)
      `)
      .eq('growth_id', growthId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des missions pour Growth ID ${growthId}:`, error);
      return [];
    }

    console.log(`SUCCÈS - ${missions?.length || 0} missions trouvées pour Growth ID ${growthId}:`, missions);
    
    if (!missions || missions.length === 0) {
      console.log(`ATTENTION - Aucune mission associée au Growth ID ${growthId}`);
      
      // Pour le débogage, vérifions si des missions existent avec ce growth_id
      const { data: allMissions } = await supabase
        .from('missions')
        .select('id, name, client, growth_id')
        .limit(20);
        
      console.log("DEBUG - Échantillon des missions disponibles:", allMissions);
      
      return [];
    }
    
    // Mapper les données de mission au format attendu
    const mappedMissions = missions.map(mission => {
      const profileData = mission.profiles || null;
      
      const mappedMission: Mission = {
        id: mission.id,
        name: mission.name || (mission.client ? `${mission.client}` : `Mission ${mission.id.substring(0, 6)}`),
        sdrId: mission.sdr_id || "",
        description: mission.description || "",
        createdAt: new Date(mission.created_at),
        sdrName: profileData?.name || "À déterminer",
        requests: [],
        startDate: mission.start_date ? new Date(mission.start_date) : new Date(),
        endDate: mission.end_date ? new Date(mission.end_date) : null,
        type: (mission.type as MissionType) || "Full",
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
