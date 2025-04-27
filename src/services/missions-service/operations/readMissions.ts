
import { Mission } from "@/types/types";
import { isSupabaseConfigured } from "@/services/missions/config";
import { isSupabaseAuthenticated } from "../auth/supabaseAuth";
import { mapSupaMissionToMission } from "@/services/missions/utils";
import { getAllSupaMissions, getSupaMissionsByUserId, getSupaMissionById } from "@/services/missions/utils";

// Rename to better match our calling convention throughout the app
export const getAllMissionsFromSupabase = async (): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return [];
    }

    const missions = await getAllSupaMissions();
    return missions.map(mission => mapSupaMissionToMission(mission));
  } catch (error) {
    console.error("Error fetching missions from Supabase:", error);
    return [];
  }
};

// Rename to getMissionsBySdrId for consistency with other method names
export const getMissionsBySdrId = async (userId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !userId) {
      console.log("Supabase not configured, user not authenticated, or invalid user ID");
      return [];
    }

    const missions = await getSupaMissionsByUserId(userId);
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

    const mission = await getSupaMissionById(missionId);
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
