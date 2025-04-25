
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
