
import { supabase } from "@/integrations/supabase/client";

export const deleteDatabaseFile = async (id: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression du fichier avec l'ID: ${id}`);
    
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
        console.log("URL du fichier à supprimer:", fileData.file_url);
        
        if (fileData.file_url.includes('/storage/v1/object/public/databases/')) {
          const pathParts = fileData.file_url.split('/storage/v1/object/public/databases/');
          if (pathParts.length > 1) {
            filePath = pathParts[1];
            console.log("Chemin du fichier extrait:", filePath);
          }
        } else {
          // Essayer d'extraire le nom du fichier directement
          const segments = fileData.file_url.split('/');
          filePath = segments[segments.length - 1];
          console.log("Nom du fichier extrait:", filePath);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction du chemin du fichier:", error);
    }
    
    // Supprimer le fichier du stockage si nous avons pu extraire son chemin
    if (filePath) {
      console.log(`Suppression du fichier ${filePath} dans le bucket 'databases'`);
      
      const { error: storageError } = await supabase.storage
        .from('databases')
        .remove([filePath]);
      
      if (storageError) {
        console.error("Erreur lors de la suppression du fichier du stockage:", storageError);
        // Continuer la suppression de l'entrée de la base de données même si la suppression du fichier échoue
      } else {
        console.log("Fichier supprimé avec succès du stockage");
      }
    }
    
    // Supprimer l'entrée de la base de données
    console.log(`Suppression de l'entrée avec ID ${id} de la table database_files`);
    
    const { error: dbError } = await supabase
      .from('database_files')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error("Erreur lors de la suppression de l'entrée de la base de données:", dbError);
      return false;
    }
    
    console.log("Entrée de base de données supprimée avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de la base de données:", error);
    return false;
  }
};
