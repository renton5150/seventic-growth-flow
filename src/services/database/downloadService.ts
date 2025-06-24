
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
    if (!fileUrl.startsWith('http') && !fileUrl.startsWith('https://')) {
      console.log(`[downloadFile:${requestId}] Détection d'un chemin relatif ancien format: ${fileUrl}`);
      
      let filePath = fileUrl;
      
      // Nettoyer le chemin s'il commence par "uploads/"
      if (filePath.startsWith('uploads/')) {
        filePath = filePath.substring(8); // Supprimer "uploads/"
        console.log(`[downloadFile:${requestId}] Chemin nettoyé: ${filePath}`);
      }
      
      // Pour les anciens fichiers, essayer d'abord le bucket blacklists
      console.log(`[downloadFile:${requestId}] Tentative dans le bucket blacklists pour ancien fichier`);
      
      try {
        const { data, error } = await supabase.storage
          .from('blacklists')
          .download(filePath);
        
        if (!error && data) {
          console.log(`[downloadFile:${requestId}] Fichier trouvé dans blacklists`);
          const blob = new Blob([data]);
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          
          console.log(`[downloadFile:${requestId}] Téléchargement réussi depuis blacklists`);
          return true;
        }
        
        console.log(`[downloadFile:${requestId}] Fichier non trouvé dans blacklists, essai avec databases`);
      } catch (err) {
        console.log(`[downloadFile:${requestId}] Erreur avec blacklists, essai avec databases:`, err);
      }
      
      // Fallback vers le bucket databases
      try {
        const { data, error } = await supabase.storage
          .from('databases')
          .download(filePath);
        
        if (error) {
          console.error(`[downloadFile:${requestId}] Erreur avec databases:`, error);
          
          // Essayer aussi avec le bucket "requests" pour les fichiers de blacklist
          console.log(`[downloadFile:${requestId}] Tentative avec le bucket requests`);
          
          try {
            const { data: requestData, error: requestError } = await supabase.storage
              .from('requests')
              .download(filePath);
            
            if (!requestError && requestData) {
              console.log(`[downloadFile:${requestId}] Fichier trouvé dans requests`);
              const blob = new Blob([requestData]);
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
              
              console.log(`[downloadFile:${requestId}] Téléchargement réussi depuis requests`);
              return true;
            }
          } catch (requestErr) {
            console.log(`[downloadFile:${requestId}] Erreur avec requests:`, requestErr);
          }
          
          toast.error(`Fichier non trouvé: ${fileName}`);
          return false;
        }
        
        if (!data) {
          console.error(`[downloadFile:${requestId}] Aucune donnée reçue`);
          toast.error("Erreur lors du téléchargement: aucune donnée reçue");
          return false;
        }
        
        const blob = new Blob([data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        console.log(`[downloadFile:${requestId}] Téléchargement réussi depuis databases`);
        return true;
      } catch (supabaseError) {
        console.error(`[downloadFile:${requestId}] Exception lors du téléchargement depuis Supabase:`, supabaseError);
        toast.error("Erreur lors du téléchargement depuis le stockage");
        return false;
      }
    }
    
    // Logique pour les URLs complètes (nouveaux fichiers)
    let cleanUrl = fileUrl;
    
    // Nettoyer l'URL en supprimant les paramètres de token qui peuvent être expirés
    if (fileUrl.includes('?token=')) {
      cleanUrl = fileUrl.split('?token=')[0];
      console.log(`[downloadFile:${requestId}] URL nettoyée: ${cleanUrl}`);
    }
    
    // Vérifier si c'est une URL Supabase Storage et extraire les informations
    const pathInfo = extractPathFromSupabaseUrl(cleanUrl);
    
    if (pathInfo) {
      console.log(`[downloadFile:${requestId}] URL Supabase analysée - Bucket: ${pathInfo.bucketName}, Chemin: ${pathInfo.filePath}`);
      
      // Téléchargement direct depuis le storage Supabase
      const { data, error } = await supabase.storage
        .from(pathInfo.bucketName)
        .download(pathInfo.filePath);
      
      if (error) {
        console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis Supabase:`, error);
        
        // Essayer dans d'autres buckets si le premier échoue
        const fallbackBuckets = ['blacklists', 'databases', 'requests'];
        const originalBucket = pathInfo.bucketName;
        
        for (const bucket of fallbackBuckets) {
          if (bucket === originalBucket) continue;
          
          console.log(`[downloadFile:${requestId}] Tentative de fallback vers le bucket: ${bucket}`);
          
          try {
            const { data: fallbackData, error: fallbackError } = await supabase.storage
              .from(bucket)
              .download(pathInfo.filePath);
            
            if (!fallbackError && fallbackData) {
              console.log(`[downloadFile:${requestId}] Fichier trouvé dans le bucket: ${bucket}`);
              const blob = new Blob([fallbackData]);
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
              
              console.log(`[downloadFile:${requestId}] Téléchargement réussi depuis le bucket: ${bucket}`);
              return true;
            }
          } catch (fallbackErr) {
            console.log(`[downloadFile:${requestId}] Erreur avec le bucket ${bucket}:`, fallbackErr);
          }
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
    }
    
    // Essayer un téléchargement direct via fetch pour les URLs externes
    try {
      console.log(`[downloadFile:${requestId}] Tentative de téléchargement direct via fetch`);
      const response = await fetch(cleanUrl, {
        mode: 'cors',
        headers: {
          'Accept': '*/*',
        }
      });
      
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
      console.error(`[downloadFile:${requestId}] Impossible d'extraire les informations de chemin pour l'URL: ${cleanUrl}`);
      toast.error("Format d'URL non reconnu ou fichier inaccessible");
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    toast.error("Erreur lors du téléchargement");
    return false;
  }
};

// Export avec un nom alternatif pour maintenir la compatibilité
export const downloadDatabaseFile = downloadFile;
