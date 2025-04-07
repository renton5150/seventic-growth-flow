
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from "@/types/database.types";
import { isSupabaseConfigured, demoDatabases } from "./config";
import { mapToDatabaseFile } from "./utils";

// Obtenir toutes les bases de données
export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Mode démo: retour des bases de données locales");
      return demoDatabases;
    }
    
    const { data, error } = await supabase
      .from("database_files")
      .select();
      
    if (error) {
      console.error("Erreur lors de la récupération des bases de données:", error);
      return [];
    }
    
    // Convertir les données du format snake_case au format camelCase
    return data.map(mapToDatabaseFile);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des bases de données:", error);
    return [];
  }
};

// Obtenir une base de données par ID
export const getDatabaseById = async (databaseId: string): Promise<DatabaseFile | null> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Mode démo: recherche d'une base de données locale");
      return demoDatabases.find(db => db.id === databaseId) || null;
    }
    
    const { data, error } = await supabase
      .from("database_files")
      .select()
      .eq("id", databaseId)
      .single();
      
    if (error) {
      console.error("Erreur lors de la récupération de la base de données:", error);
      return null;
    }
    
    // Convertir les données du format snake_case au format camelCase
    return mapToDatabaseFile(data);
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la base de données:", error);
    return null;
  }
};
