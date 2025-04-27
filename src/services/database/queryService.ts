
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from '@/types/database.types';

export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('database_files')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des bases de données:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des bases de données:", error);
    return [];
  }
};
