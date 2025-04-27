
import { createSupaMission, updateSupaMission } from "@/services/missions/utils";
import { isSupabaseAuthenticated } from "../auth/supabaseAuth";
import { isSupabaseConfigured } from "@/services/missions/config";
import { supabase } from "@/integrations/supabase/client";
import { Mission } from "@/types/types";

// Create a new mission in Supabase
export const createSupabaseMission = async (data: any): Promise<any> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      throw new Error("Unable to create mission: Supabase not configured or user not authenticated");
    }

    const mission = await createSupaMission(data);
    return mission;
  } catch (error) {
    console.error("Error creating mission:", error);
    throw error;
  }
};

// Update an existing mission in Supabase
export const updateSupabaseMission = async (data: any): Promise<any> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      throw new Error("Unable to update mission: Supabase not configured or user not authenticated");
    }

    const mission = await updateSupaMission(data);
    return mission;
  } catch (error) {
    console.error("Error updating mission:", error);
    throw error;
  }
};

// Delete a mission from Supabase
export const deleteSupabaseMission = async (missionId: string): Promise<boolean> => {
  try {
    const isAuthenticated = await isSupabaseAuthenticated();
    
    if (!isSupabaseConfigured || !isAuthenticated) {
      console.log("Supabase not configured or user not authenticated");
      throw new Error("Unable to delete mission: Supabase not configured or user not authenticated");
    }

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (error) {
      console.error("Error deleting mission:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting mission:", error);
    throw error;
  }
};
