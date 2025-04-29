
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
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[downloadFile:${requestId}] Tentative de téléchargement: ${fileUrl} avec le nom ${fileName}`);
    
    // Pour les URL complètes, essayer d'abord un téléchargement direct via fetch
    if (fileUrl.includes('http')) {
      try {
        console.log(`[downloadFile:${requestId}] Tentative de téléchargement direct via fetch`);
        const success = await utilsDownloadFile(fileUrl, fileName);
        if (success) {
          console.log(`[downloadFile:${requestId}] Téléchargement direct réussi pour: ${fileUrl}`);
          return true;
        }
      } catch (fetchError) {
        console.error(`[downloadFile:${requestId}] Échec du téléchargement direct:`, fetchError);
        // Continuer avec la méthode Supabase si fetch échoue
      }
    }
    
    // Vérifier si c'est une URL Supabase Storage
    const pathInfo = extractPathFromSupabaseUrl(fileUrl);
    
    if (!pathInfo) {
      console.error(`[downloadFile:${requestId}] Impossible d'extraire les informations de chemin pour l'URL: ${fileUrl}`);
      toast.error("Format d'URL non reconnu");
      return false;
    }
    
    console.log(`[downloadFile:${requestId}] URL analysée - Bucket: ${pathInfo.bucketName}, Chemin: ${pathInfo.filePath}`);
    
    // Téléchargement direct depuis le storage Supabase
    const { data, error } = await supabase.storage
      .from(pathInfo.bucketName)
      .download(pathInfo.filePath);
    
    if (error) {
      console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis Supabase:`, error);
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
    
    if (!data) {
      console.error(`[downloadFile:${requestId}] Aucune donnée reçue de Supabase Storage pour: ${fileUrl}`);
      toast.error("Erreur lors du téléchargement: aucune donnée reçue");
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
    
    console.log(`[downloadFile:${requestId}] Téléchargement depuis Supabase réussi pour: ${fileUrl}`);
    return true;
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    toast.error("Erreur lors du téléchargement");
    return false;
  }
};
