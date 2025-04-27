
import { supabase } from "@/integrations/supabase/client";

export const deleteDatabaseFile = async (id: string): Promise<boolean> => {
  try {
    // Récupérer d'abord les informations du fichier
    const { data: fileData, error: fileError } = await supabase
      .from('database_files')
      .select('file_url')
      .eq('id', id)
      .single();
    
    if (fileError || !fileData) {
      console.error("Erreur lors de la récupération du fichier:", fileError);
      return false;
    }
    
    // Extraire le chemin du fichier à partir de l'URL
    let filePath = "";
    try {
      if (fileData.file_url) {
        const url = new URL(fileData.file_url);
        // Get the path after /storage/v1/object/public/databases/
        const pathParts = url.pathname.split('/storage/v1/object/public/databases/');
        if (pathParts.length > 1) {
          filePath = pathParts[1];
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction du chemin du fichier:", error);
    }
    
    // Supprimer le fichier du stockage si nous avons pu extraire son chemin
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('databases')
        .remove([filePath]);
      
      if (storageError) {
        console.error("Erreur lors de la suppression du fichier du stockage:", storageError);
        // Continuer la suppression de l'entrée de la base de données même si la suppression du fichier échoue
      }
    }
    
    // Supprimer l'entrée de la base de données
    const { error: dbError } = await supabase
      .from('database_files')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error("Erreur lors de la suppression de l'entrée de la base de données:", dbError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de la base de données:", error);
    return false;
  }
};
