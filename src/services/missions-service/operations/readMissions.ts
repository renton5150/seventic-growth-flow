
import { Mission } from "@/types/types";
import { isSupabaseConfigured } from "@/services/missions/config";
import { isSupabaseAuthenticated } from "../auth/supabaseAuth";
import { mapSupaMissionToMission } from "@/services/missions/utils";
import { getAllSupaMissions, getSupaMissionsByUserId, getSupaMissionById } from "@/services/missions/utils";

export const getSupabaseMissions = async (): Promise<Mission[]> => {
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

export const getSupabaseUserMissions = async (userId: string): Promise<Mission[]> => {
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

export const getSupabaseMissionById = async (missionId: string): Promise<Mission | undefined> => {
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
