
import { Mission, MissionType, MissionStatus } from "@/types/types";
import { isSupabaseConfigured } from "@/services/missions/config";
import {
  getAllSupaMissions,
  getSupaMissionsByUserId,
  getSupaMissionById,
  createSupaMission,
  deleteSupaMission,
  checkMissionExists,
  updateSupaMission
} from "@/services/missions";

/**
 * Checks if a user is authenticated with Supabase
 */
export const isSupabaseAuthenticated = async (): Promise<boolean> => {
  try {
    // Import dynamically to avoid circular reference issues
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking Supabase authentication:", error);
    return false;
  }
};

/**
 * Gets all missions from Supabase with authentication and error handling
 */
export const getSupabaseMissions = async (): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return [];
    }

    return await getAllSupaMissions();
  } catch (error) {
    console.error("Error fetching missions from Supabase:", error);
    return [];
  }
};

/**
 * Gets a user's missions from Supabase with authentication and error handling
 */
export const getSupabaseUserMissions = async (userId: string): Promise<Mission[]> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !userId) {
      console.log("Supabase not configured, user not authenticated, or invalid user ID");
      return [];
    }

    return await getSupaMissionsByUserId(userId);
  } catch (error) {
    console.error("Error fetching user missions from Supabase:", error);
    return [];
  }
};

/**
 * Gets a mission by ID from Supabase with authentication and error handling
 */
export const getSupabaseMissionById = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated || !missionId) {
      console.log("Supabase not configured, user not authenticated, or invalid mission ID");
      return undefined;
    }

    return await getSupaMissionById(missionId);
  } catch (error) {
    console.error("Error fetching mission from Supabase:", error);
    return undefined;
  }
};

/**
 * Creates a mission in Supabase with authentication and error handling
 */
export const createSupabaseMission = async (data: {
  name: string;
  description?: string;
  sdrId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: string;
  status?: MissionStatus;
}): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return undefined;
    }
    
    // Ensure sdrId is defined
    if (!data.sdrId) {
      console.error("Missing SDR ID!");
      throw new Error("SDR is required to create a mission");
    }

    // Ensure type is a valid MissionType
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    return await createSupaMission({
      ...data,
      type: missionType,
      status: data.status || "En cours"
    });
  } catch (error) {
    console.error("Error creating mission in Supabase:", error);
    throw error;
  }
};

/**
 * Updates a mission in Supabase with authentication and error handling
 */
export const updateSupabaseMission = async (data: {
  id: string;
  name: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  status?: MissionStatus;
}, userRole?: string): Promise<Mission | undefined> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return undefined;
    }
    
    // Ensure sdrId is defined
    if (!data.sdrId) {
      console.error("Missing SDR ID!");
      throw new Error("SDR is required to update a mission");
    }

    // Ensure type is a valid MissionType
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    console.log("Statut avant envoi à updateSupaMission:", data.status);
    
    return await updateSupaMission({
      ...data,
      type: missionType,
      status: data.status
    }, userRole);
  } catch (error) {
    console.error("Error updating mission in Supabase:", error);
    throw error;
  }
};

/**
 * Deletes a mission from Supabase with authentication and error handling
 */
export const deleteSupabaseMission = async (missionId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      return false;
    }

    // Check if mission exists before attempting to delete
    const exists = await checkMissionExists(missionId);
    if (!exists) {
      console.error("Mission does not exist:", missionId);
      throw new Error("Mission does not exist or has already been deleted");
    }

    return await deleteSupaMission(missionId);
  } catch (error) {
    console.error("Error deleting mission from Supabase:", error);
    throw error;
  }
};
