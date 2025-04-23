
import { Mission, MissionType } from "@/types/types";
import { isSupabaseConfigured } from "@/services/missions/config";
import { isSupabaseAuthenticated } from "../auth/supabaseAuth";
import { createSupaMission, updateSupaMission } from "@/services/missions/utils";
import { mapSupaMissionToMission } from "@/services/missions/utils";
import { supabase } from "@/integrations/supabase/client";

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
    
    if (!data.sdrId) {
      console.error("Missing SDR ID!");
      throw new Error("SDR is required to create a mission");
    }

    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    const mission = await createSupaMission({
      ...data,
      type: missionType
    });

    return mission ? mapSupaMissionToMission(mission) : undefined;
  } catch (error) {
    console.error("Error creating mission in Supabase:", error);
    throw error;
  }
};

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
    
    if (!data.sdrId) {
      console.error("Missing SDR ID!");
      throw new Error("SDR is required to update a mission");
    }

    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    const mission = await updateSupaMission({
      ...data,
      type: missionType,
      status: data.status || "En cours"
    });

    return mission ? mapSupaMissionToMission(mission) : undefined;
  } catch (error) {
    console.error("Error updating mission in Supabase:", error);
    throw error;
  }
};

export const deleteSupabaseMission = async (missionId: string): Promise<boolean> => {
  if (!missionId) {
    throw new Error("Invalid mission ID");
  }

  try {
    console.log("Starting mission deletion:", missionId);
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error("Authentication error");
    }
    
    if (!sessionData.session) {
      throw new Error("User not authenticated");
    }
    
    console.log("Valid session, executing deletion...");
    
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId);
    
    if (error) {
      console.error("Supabase deletion error:", error);
      throw new Error(`Deletion error: ${error.message}`);
    }
    
    console.log("Mission successfully deleted in Supabase");
    return true;
  } catch (error: any) {
    console.error("Critical error during deletion:", error);
    throw error;
  }
};
