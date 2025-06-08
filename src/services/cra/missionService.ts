
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  name: string;
  client: string;
}

export const getActiveMissions = async (): Promise<Mission[]> => {
  const { data, error } = await supabase
    .from("missions")
    .select("id, name, client")
    .eq("status", "En cours")
    .order("name");
    
  if (error) {
    console.error("Error fetching active missions:", error);
    return [];
  }
  
  return data || [];
};
