
import { extractPathFromSupabaseUrl, downloadFile as utilsDownloadFile } from './utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Télécharge un fichier à partir d'une URL
 * @param fileUrl URL du fichier à télécharger
 * @param fileName Nom du fichier à utiliser pour le téléchargement
 * @returns Promise<boolean> indiquant si le téléchargement a réussi
 */
export const downloadFile = async (fileUrl: string, fileName: string): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${fileUrl} avec le nom ${fileName}`);
    
    // Vérifier si c'est une URL Supabase Storage
    const pathInfo = extractPathFromSupabaseUrl(fileUrl);
    
    if (pathInfo) {
      console.log(`URL Supabase détectée. Bucket: ${pathInfo.bucketName}, Chemin: ${pathInfo.filePath}`);
      
      // Téléchargement direct depuis le storage Supabase
      const { data, error } = await supabase.storage
        .from(pathInfo.bucketName)
        .download(pathInfo.filePath);
      
      if (error) {
        console.error("Erreur lors du téléchargement depuis Supabase:", error);
        return false;
      }
      
      if (!data) {
        console.error("Aucune donnée reçue de Supabase Storage");
        return false;
      }
      
      // Création d'un blob et téléchargement
      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } else {
      // URL non-Supabase, utiliser la fonction de téléchargement générique
      console.log("URL standard détectée, utilisation de la méthode de téléchargement générique");
      return await utilsDownloadFile(fileUrl, fileName);
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    toast.error("Erreur lors du téléchargement");
    return false;
  }
};
