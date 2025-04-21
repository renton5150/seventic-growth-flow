
import { Mission, MissionType } from "@/types/types";
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
      type: missionType
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
  status?: "En cours" | "Fin";
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
      throw new Error("SDR is required to update a mission");
    }

    // Ensure type is a valid MissionType
    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    // Log the status value to help with debugging
    console.log("Status being passed to updateSupaMission:", data.status);
    
    return await updateSupaMission({
      ...data,
      type: missionType,
      status: data.status || "En cours"
    });
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
    if (!missionId) {
      console.error("Missing mission ID for deletion");
      throw new Error("ID de mission invalide");
    }

    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.error("Supabase not configured or user not authenticated");
      throw new Error("Authentification requise");
    }

    // Double check if mission exists before attempting to delete
    try {
      const exists = await checkMissionExists(missionId);
      if (!exists) {
        console.warn("Mission does not exist or already deleted:", missionId);
        // Return true since the end result is the same - mission no longer exists
        return true;
      }
    } catch (checkError) {
      console.error("Error checking if mission exists:", checkError);
      // Continue with deletion attempt even if check fails
    }

    // Wrap the actual deletion in a try-catch to handle specific delete errors
    try {
      const result = await deleteSupaMission(missionId);
      console.log("Delete operation result:", result);
      return result;
    } catch (deleteError: any) {
      // Handle specific deletion errors
      console.error("Error during mission deletion:", deleteError);
      
      // If the error indicates the mission doesn't exist, consider it "deleted"
      if (deleteError.message && 
          (deleteError.message.includes("not exist") || 
           deleteError.message.includes("not found"))) {
        return true;
      }
      
      throw deleteError; // Re-throw for the caller to handle
    }
  } catch (error) {
    console.error("Error in deleteSupabaseMission wrapper:", error);
    throw error;
  }
};
