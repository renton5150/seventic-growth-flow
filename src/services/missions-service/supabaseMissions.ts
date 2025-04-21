
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
  console.log("Starting mission deletion process for ID:", missionId);
  
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

    // Check if mission exists before attempting to delete
    let exists = false;
    try {
      exists = await checkMissionExists(missionId);
      console.log("Mission existence check:", exists ? "exists" : "does not exist");
      
      if (!exists) {
        console.warn("Mission does not exist or already deleted:", missionId);
        return true; // Consider it success since the mission is already gone
      }
    } catch (checkError) {
      console.error("Error checking if mission exists:", checkError);
      // Continue with deletion attempt anyway
    }

    // Perform the deletion with a retry mechanism
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempting to delete mission (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        const result = await deleteSupaMission(missionId);
        console.log("Delete operation completed successfully");
        return true;
      } catch (deleteError: any) {
        console.error(`Error during deletion attempt ${retryCount + 1}:`, deleteError);
        
        // If this indicates the mission doesn't exist, consider it a success
        if (deleteError.message && 
            (deleteError.message.includes("not exist") || 
             deleteError.message.includes("not found"))) {
          console.log("Mission doesn't exist in database - considering deletion successful");
          return true;
        }
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${(retryCount + 1) * 500}ms...`);
          await new Promise(r => setTimeout(r, (retryCount + 1) * 500));
          retryCount++;
        } else {
          throw deleteError; // Re-throw after all retries fail
        }
      }
    }
    
    throw new Error("Failed to delete after multiple attempts");
  } catch (error) {
    console.error("Fatal error in deleteSupabaseMission:", error);
    throw error;
  }
};
