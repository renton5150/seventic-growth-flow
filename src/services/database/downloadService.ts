
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
    console.log(`[downloadFile:${requestId}] Début du téléchargement: ${fileUrl} avec le nom ${fileName}`);
    
    // Pour les URLs complètes Supabase, utiliser l'extraction du chemin
    if (fileUrl.includes('storage/v1')) {
      let cleanUrl = fileUrl;
      
      if (fileUrl.includes('?token=')) {
        cleanUrl = fileUrl.split('?token=')[0];
        console.log(`[downloadFile:${requestId}] URL nettoyée: ${cleanUrl}`);
      }
      
      const pathInfo = extractPathFromSupabaseUrl(cleanUrl);
      
      if (pathInfo) {
        console.log(`[downloadFile:${requestId}] URL Supabase analysée - Bucket: ${pathInfo.bucketName}, Chemin: ${pathInfo.filePath}`);
        
        const { data, error } = await supabase.storage
          .from(pathInfo.bucketName)
          .download(pathInfo.filePath);
        
        if (error) {
          console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis Supabase:`, error);
          toast.error(`Erreur: ${error.message}`);
          return false;
        }
        
        if (!data) {
          console.error(`[downloadFile:${requestId}] Aucune donnée reçue de Supabase Storage`);
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
        
        console.log(`[downloadFile:${requestId}] ✅ Téléchargement depuis Supabase réussi`);
        return true;
      }
    }
    
    // Pour les noms de fichiers simples (sans URL complète), rechercher dans les buckets
    if (!fileUrl.startsWith('http')) {
      console.log(`[downloadFile:${requestId}] Recherche du fichier ${fileUrl} dans les buckets`);
      
      const buckets = ['blacklists', 'requests', 'databases', 'templates'];
      
      for (const bucket of buckets) {
        try {
          console.log(`[downloadFile:${requestId}] Tentative dans le bucket: ${bucket}`);
          
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(fileUrl);
          
          if (!error && data) {
            console.log(`[downloadFile:${requestId}] ✅ Fichier trouvé dans ${bucket}`);
            
            const blob = new Blob([data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            console.log(`[downloadFile:${requestId}] ✅ Téléchargement réussi depuis ${bucket}`);
            return true;
          }
        } catch (err) {
          console.log(`[downloadFile:${requestId}] Fichier non trouvé dans ${bucket}`);
        }
      }
      
      console.error(`[downloadFile:${requestId}] ❌ Fichier ${fileUrl} non trouvé dans aucun bucket`);
      toast.error(`Fichier "${fileUrl}" non trouvé dans le stockage`);
      return false;
    }
    
    // Essayer un téléchargement direct via fetch pour les URLs externes
    try {
      console.log(`[downloadFile:${requestId}] Tentative de téléchargement direct via fetch`);
      const response = await fetch(fileUrl, {
        mode: 'cors',
        headers: {
          'Accept': '*/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
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
      
      console.log(`[downloadFile:${requestId}] ✅ Téléchargement direct réussi`);
      return true;
    } catch (fetchError) {
      console.error(`[downloadFile:${requestId}] Échec du téléchargement direct:`, fetchError);
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
