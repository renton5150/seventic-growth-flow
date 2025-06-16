
import { extractPathFromSupabaseUrl } from './utils';
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
    
    // Nettoyer l'URL en supprimant les paramètres de token qui peuvent être expirés
    let cleanUrl = fileUrl;
    if (fileUrl.includes('?token=')) {
      cleanUrl = fileUrl.split('?token=')[0];
      console.log(`[downloadFile:${requestId}] URL nettoyée: ${cleanUrl}`);
    }
    
    // Essayer d'abord un téléchargement direct via fetch
    try {
      console.log(`[downloadFile:${requestId}] Tentative de téléchargement direct via fetch`);
      const response = await fetch(cleanUrl);
      
      if (!response.ok) {
        console.log(`[downloadFile:${requestId}] Fetch échoué avec status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Vérifier que le blob n'est pas vide
      if (blob.size === 0) {
        console.log(`[downloadFile:${requestId}] Blob vide reçu`);
        throw new Error("Fichier vide reçu");
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`[downloadFile:${requestId}] Téléchargement direct réussi pour: ${fileUrl}`);
      return true;
    } catch (fetchError) {
      console.error(`[downloadFile:${requestId}] Échec du téléchargement direct:`, fetchError);
      // Continuer avec la méthode Supabase si fetch échoue
    }
    
    // Vérifier si c'est une URL Supabase Storage
    const pathInfo = extractPathFromSupabaseUrl(cleanUrl);
    
    if (!pathInfo) {
      console.error(`[downloadFile:${requestId}] Impossible d'extraire les informations de chemin pour l'URL: ${cleanUrl}`);
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

// Ajout d'une fonction d'export avec un nom alternatif pour maintenir la compatibilité
export const downloadDatabaseFile = downloadFile;
