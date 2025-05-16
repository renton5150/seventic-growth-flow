
import { supabase } from "@/integrations/supabase/client";
import { Mission, MissionType } from "@/types/types";

// Simple function to check if a mission exists by ID
export const checkMissionExists = async (missionId: string): Promise<boolean> => {
  if (!missionId) return false;
  
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('id')
      .eq('id', missionId)
      .single();
      
    if (error || !data) {
      console.error("Error checking mission existence:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in checkMissionExists:", error);
    return false;
  }
};

// Get all missions from Supabase
export const getAllSupaMissions = async () => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*');
      
    if (error) {
      console.error("Error fetching all missions:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getAllSupaMissions:", error);
    return [];
  }
};

// Get missions by user ID
export const getSupaMissionsByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('sdr_id', userId);
      
    if (error) {
      console.error(`Error fetching missions for user ${userId}:`, error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSupaMissionsByUserId:", error);
    return [];
  }
};

// Get a single mission by ID
export const getSupaMissionById = async (missionId: string) => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();
      
    if (error) {
      console.error(`Error fetching mission ${missionId}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSupaMissionById:", error);
    return null;
  }
};

// Create a new mission
export const createSupaMission = async (missionData: any) => {
  try {
    // Convert mission data to match Supabase column names
    const supabaseMissionData = {
      name: missionData.name,
      sdr_id: missionData.sdrId || null, // Use null if sdrId is empty
      description: missionData.description || "",
      start_date: missionData.startDate ? new Date(missionData.startDate).toISOString() : null,
      end_date: missionData.endDate ? new Date(missionData.endDate).toISOString() : null,
      type: missionData.type || "Full",
      client: missionData.client || missionData.name, // Use name as client if not provided
      status: missionData.status || "En cours"
    };
    
    console.log("Formatted data for Supabase insertion:", supabaseMissionData);

    const { data, error } = await supabase
      .from('missions')
      .insert([supabaseMissionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating mission in Supabase:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No data returned after mission creation");
      return null;
    }

    console.log("Mission created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createSupaMission:", error);
    throw error;
  }
};

// Update an existing mission
export const updateSupaMission = async (missionData: any) => {
  try {
    // Format the data to match Supabase column names
    const supabaseMissionData = {
      name: missionData.name,
      sdr_id: missionData.sdrId || null,
      description: missionData.description || "",
      start_date: missionData.startDate ? new Date(missionData.startDate).toISOString() : null,
      end_date: missionData.endDate ? new Date(missionData.endDate).toISOString() : null,
      type: missionData.type || "Full",
      status: missionData.status || "En cours"
    };
    
    const { data, error } = await supabase
      .from('missions')
      .update(supabaseMissionData)
      .eq('id', missionData.id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating mission ${missionData.id}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateSupaMission:", error);
    throw error;
  }
};

/**
 * Maps a Supabase mission data object to the Mission type used in the application
 * with enhanced handling of mission names and client information to ensure consistency
 * between SDR and Growth users
 */
export const mapSupaMissionToMission = (mission: any): Mission => {
  // Extract SDR profile information - handle both array and object formats
  // When we join with profiles, Supabase returns it as an object under the relation name
  // or as an array of objects in newer versions of the API
  let sdrProfile = null;
  
  if (mission.profiles) {
    if (Array.isArray(mission.profiles) && mission.profiles.length > 0) {
      sdrProfile = mission.profiles[0];
    } else {
      sdrProfile = mission.profiles;
    }
  }
  
  console.log('Mission mapping - Raw mission data:', {
    id: mission.id,
    name: mission.name,
    client: mission.client
  });

  // CRITICAL: Use EXACT SAME priority logic as formatRequestFromDb
  // PRIORITÉ: client > name > ID court
  let displayName = "Sans mission";
  let clientName = "Sans mission";
  
  if (mission.client && mission.client.trim() !== "" && 
      mission.client !== "null" && mission.client !== "undefined") {
    clientName = mission.client;
    displayName = clientName;
    console.log(`[mapSupaMissionToMission] PRIORITY #1: Using client: "${displayName}"`);
  }
  else if (mission.name && mission.name.trim() !== "" && 
           mission.name !== "null" && mission.name !== "undefined") {
    displayName = mission.name;
    clientName = displayName;
    console.log(`[mapSupaMissionToMission] PRIORITY #2: Using name: "${displayName}"`);
  }
  else if (mission.id) {
    displayName = `Mission ${mission.id.substring(0, 8)}`;
    clientName = displayName;
    console.log(`[mapSupaMissionToMission] PRIORITY #3: Using short ID: "${displayName}"`);
  }
  
  console.log(`[mapSupaMissionToMission] FINAL name chosen: "${displayName}", Client: "${clientName}"`);

  return {
    id: mission.id,
    name: displayName,
    description: mission.description || '',
    sdrId: mission.sdr_id || null,
    sdrName: sdrProfile?.name || null,
    createdAt: new Date(mission.created_at),
    startDate: mission.start_date ? new Date(mission.start_date) : null,
    endDate: mission.end_date ? new Date(mission.end_date) : null,
    type: (mission.type as MissionType) || 'Full',
    status: mission.status === "Fin" ? "Fin" : "En cours",
    client: clientName,
    requests: []
  };
};
