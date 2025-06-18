
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
    
    // Vérifier si c'est un chemin relatif (ancien format)
    let cleanUrl = fileUrl;
    let isRelativePath = false;
    
    if (!fileUrl.startsWith('http') && !fileUrl.startsWith('https://')) {
      console.log(`[downloadFile:${requestId}] Détection d'un chemin relatif: ${fileUrl}`);
      isRelativePath = true;
      
      // Déterminer le bucket approprié en fonction du chemin
      let bucketName = 'databases'; // bucket par défaut
      let filePath = fileUrl;
      
      // Nettoyer le chemin s'il commence par "uploads/"
      if (filePath.startsWith('uploads/')) {
        filePath = filePath.substring(8); // Supprimer "uploads/"
      }
      
      // Si le chemin contient "blacklist", utiliser le bucket blacklists
      if (filePath.toLowerCase().includes('blacklist') || filePath.toLowerCase().includes('audit')) {
        bucketName = 'blacklists';
      }
      
      console.log(`[downloadFile:${requestId}] Bucket déterminé: ${bucketName}, chemin: ${filePath}`);
      
      try {
        // Téléchargement direct depuis le storage Supabase avec le chemin déterminé
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath);
        
        if (error) {
          console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis le bucket ${bucketName}:`, error);
          
          // Essayer avec le bucket par défaut si échec
          if (bucketName !== 'databases') {
            console.log(`[downloadFile:${requestId}] Tentative avec le bucket databases par défaut`);
            const { data: fallbackData, error: fallbackError } = await supabase.storage
              .from('databases')
              .download(filePath);
              
            if (fallbackError) {
              console.error(`[downloadFile:${requestId}] Échec aussi avec le bucket databases:`, fallbackError);
              toast.error(`Erreur: ${error.message}`);
              return false;
            }
            
            // Utiliser les données du fallback
            console.log(`[downloadFile:${requestId}] Succès avec le bucket databases`);
            const blob = new Blob([fallbackData]);
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
          }
          
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
      } catch (supabaseError) {
        console.error(`[downloadFile:${requestId}] Exception lors du téléchargement depuis Supabase:`, supabaseError);
        toast.error("Erreur lors du téléchargement depuis le stockage");
        return false;
      }
    }
    
    // Nettoyer l'URL en supprimant les paramètres de token qui peuvent être expirés
    if (fileUrl.includes('?token=')) {
      cleanUrl = fileUrl.split('?token=')[0];
      console.log(`[downloadFile:${requestId}] URL nettoyée: ${cleanUrl}`);
    }
    
    // Essayer d'abord un téléchargement direct via fetch pour les URLs complètes
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
