
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
    
    // La valeur sdrId peut être vide pour les missions sans SDR attribué
    console.log("Creating mission with data:", data);
    console.log("SDR ID:", data.sdrId);

    const missionType: MissionType = data.type === "Part" ? "Part" : "Full";
    
    // Appel direct à createSupaMission
    const missionData = {
      name: data.name,
      sdrId: data.sdrId,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: missionType,
      client: data.name // Utilise le nom comme valeur pour client (requis par le schéma)
    };
    
    console.log("Calling createSupaMission with:", missionData);
    const missionResponse = await createSupaMission(missionData);
    console.log("Result from createSupaMission:", missionResponse);

    if (!missionResponse) {
      console.error("No mission returned from createSupaMission");
      return undefined;
    }

    // Make sure we map the Supabase response to our application's Mission type
    return mapSupaMissionToMission(missionResponse);
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
    
    if (!data.id) {
      console.error("Missing mission ID!");
      throw new Error("Mission ID is required to update a mission");
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
