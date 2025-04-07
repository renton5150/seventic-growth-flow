
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured, demoDatabases } from "./config";

// Supprimer un fichier de base de données
export const deleteDatabaseFile = async (fileId: string): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured) {
      console.log("Mode démo: simulation de suppression de fichier");
      
      // En mode démo, on retire simplement de la liste locale
      const index = demoDatabases.findIndex(db => db.id === fileId);
      if (index !== -1) {
        demoDatabases.splice(index, 1);
      }
      
      return true;
    }
    
    // Récupérer les métadonnées du fichier
    const { data: fileData, error: fetchError } = await supabase
      .from("database_files")
      .select()
      .eq("id", fileId)
      .single();
      
    if (fetchError) {
      console.error("Erreur lors de la récupération des métadonnées du fichier:", fetchError);
      return false;
    }
    
    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from("databases")
      .remove([fileData.file_name]);
      
    if (storageError) {
      console.error("Erreur lors de la suppression du fichier du stockage:", storageError);
      // Continuer pour supprimer les métadonnées même si la suppression du fichier a échoué
    }
    
    // Supprimer les métadonnées du fichier
    const { error: deleteError } = await supabase
      .from("database_files")
      .delete()
      .eq("id", fileId);
      
    if (deleteError) {
      console.error("Erreur lors de la suppression des métadonnées du fichier:", deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de la base de données:", error);
    return false;
  }
};
