
import { supabase } from "@/integrations/supabase/client";
import { extractPathFromSupabaseUrl } from './utils';
import { toast } from "sonner";

/**
 * Supprime un fichier de base de données par son ID
 * @param fileId Identifiant du fichier à supprimer
 * @returns Promise<boolean> indiquant si la suppression a réussi
 */
export const deleteDatabaseFile = async (fileId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression du fichier avec l'ID: ${fileId}`);
    
    // Récupérer les informations du fichier depuis la base de données
    const { data: fileData, error: fetchError } = await supabase
      .from('database_files')
      .select('*')
      .eq('id', fileId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Erreur lors de la récupération des informations du fichier:", fetchError);
      return false;
    }
    
    if (!fileData) {
      console.error("Fichier non trouvé dans la base de données");
      return false;
    }
    
    console.log("Informations du fichier récupérées:", fileData);
    
    // Extraire le chemin du fichier à partir de l'URL
    const pathInfo = extractPathFromSupabaseUrl(fileData.file_url);
    
    if (pathInfo) {
      console.log(`Suppression du fichier dans Supabase Storage: Bucket=${pathInfo.bucketName}, Path=${pathInfo.filePath}`);
      
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from(pathInfo.bucketName)
        .remove([pathInfo.filePath]);
      
      if (storageError) {
        console.error("Erreur lors de la suppression du fichier dans le stockage:", storageError);
        // On continue malgré l'erreur pour supprimer l'entrée de la base de données
      } else {
        console.log("Fichier supprimé du stockage avec succès");
      }
    } else {
      console.warn("Impossible d'extraire les informations de chemin à partir de l'URL:", fileData.file_url);
    }
    
    // Supprimer l'entrée de la base de données
    const { error: dbError } = await supabase
      .from('database_files')
      .delete()
      .eq('id', fileId);
    
    if (dbError) {
      console.error("Erreur lors de la suppression de l'entrée dans la base de données:", dbError);
      return false;
    }
    
    console.log("Entrée de la base de données supprimée avec succès");
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression du fichier:", error);
    return false;
  }
};
