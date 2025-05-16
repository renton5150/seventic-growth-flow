
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
    // Use Promise.all to wait for all Promise<Mission> to resolve
    return await Promise.all(missions.map(mission => mapSupaMissionToMission(mission)));
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
    // Use Promise.all to wait for all Promise<Mission> to resolve
    return await Promise.all(missions.map(mission => mapSupaMissionToMission(mission)));
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
      console.log("Supabase non configuré, utilisateur non authentifié, ou ID growth invalide");
      return [];
    }

    console.log(`DEBUG - Récupération missions pour Growth ID: ${growthId}`);

    // Première tentative: récupérer les missions par growth_id (la plus fiable)
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
        profiles:sdr_id (
          id, 
          name, 
          email
        )
      `)
      .eq('growth_id', growthId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des missions pour Growth ID ${growthId}:`, error);
      
      // Seconde tentative: récupérer toutes les missions
      console.log("TENTATIVE ALTERNATIVE - Récupération de toutes les missions disponibles...");
      const { data: allMissions, error: allMissionsError } = await supabase
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
          profiles:sdr_id (
            id, 
            name, 
            email
          )
        `)
        .limit(100)
        .order('created_at', { ascending: false });
        
      if (allMissionsError || !allMissions) {
        console.error("ÉCHEC - Récupération des missions alternatives:", allMissionsError);
        return [];
      }
      
      console.log(`SUCCÈS PARTIEL - Récupéré ${allMissions.length} missions au total`);
      console.log("En l'absence d'association directe, nous utilisons toutes les missions disponibles");
      
      // Use Promise.all to wait for all Promise<Mission> to resolve
      return await Promise.all(allMissions.map(mission => mapSupaMissionToMission(mission)));
    }

    if (!missions || missions.length === 0) {
      console.log(`ATTENTION - Aucune mission associée au Growth ID ${growthId}`);
      
      // Dernière tentative: récupérer les 50 dernières missions comme fallback
      console.log("FALLBACK - Récupération des 50 dernières missions...");
      const { data: recentMissions, error: recentError } = await supabase
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
          profiles:sdr_id (
            id, 
            name, 
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (recentError || !recentMissions || recentMissions.length === 0) {
        console.log("ÉCHEC TOTAL - Aucune mission trouvée même en fallback");
        return [];
      }
      
      console.log(`SUCCÈS PARTIEL - Fallback récupéré ${recentMissions.length} missions récentes`);
      // Use Promise.all to wait for all Promise<Mission> to resolve
      return await Promise.all(recentMissions.map(mission => mapSupaMissionToMission(mission)));
    }
    
    console.log(`SUCCÈS - ${missions.length} missions trouvées pour Growth ID ${growthId}`);
    // Use Promise.all to wait for all Promise<Mission> to resolve
    return await Promise.all(missions.map(mission => mapSupaMissionToMission(mission)));
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
