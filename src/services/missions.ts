
import { supabase } from "@/integrations/supabase/client";

export const getMissions = async () => {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .order("name");
    
  if (error) {
    console.error("Error fetching missions:", error);
    return [];
  }
  
  return data;
};

// Add checkMissionExists function to fix import errors
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
