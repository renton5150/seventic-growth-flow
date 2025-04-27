
import { Mission } from "@/types/types";
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

export const getMissionsByGrowthId = async (growthId: string): Promise<Mission[]> => {
  try {
    // Implementation of getMissionsByGrowthId
    // For now, we can return an empty array as this functionality might not be fully implemented yet
    console.log(`Fetching missions by growth ID ${growthId} - This functionality may be expanded in the future`);
    return [];
  } catch (error) {
    console.error(`Error fetching missions by growth ID ${growthId}:`, error);
    return [];
  }
};
