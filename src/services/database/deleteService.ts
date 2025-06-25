
import { supabase } from "@/integrations/supabase/client";
import { extractPathFromSupabaseUrl } from "./utils";

/**
 * Supprimer un fichier de base de données
 */
export const deleteDatabaseFile = async (fileUrl: string): Promise<boolean> => {
  try {
    console.log("Suppression du fichier:", fileUrl);
    
    // Extraire le chemin du fichier depuis l'URL
    const filePath = extractPathFromSupabaseUrl(fileUrl);
    
    if (!filePath) {
      console.error("Impossible d'extraire le chemin du fichier depuis l'URL:", fileUrl);
      return false;
    }
    
    // Supprimer le fichier du storage
    const { error } = await supabase.storage
      .from('databases')
      .remove([filePath]);
    
    if (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
      return false;
    }
    
    console.log("Fichier supprimé avec succès:", filePath);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    return false;
  }
};
