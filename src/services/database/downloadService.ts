
import { supabase } from "@/integrations/supabase/client";
import { extractFileName } from "./utils";

/**
 * Fonction pour extraire le bucket et le chemin depuis une URL Supabase
 */
const extractBucketAndPath = (url: string): { bucket: string; path: string } | null => {
  try {
    // Pattern pour les URLs Supabase Storage: /storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2])
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du bucket et path:", error);
    return null;
  }
};

/**
 * Télécharger un fichier générique
 */
export const downloadFile = async (url: string, fileName?: string): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${url}`);
    
    const finalFileName = fileName || extractFileName(url);
    
    // Pour les URLs de stockage Supabase
    if (url.includes('storage/v1')) {
      const bucketInfo = extractBucketAndPath(url);
      
      if (!bucketInfo) {
        console.error("Impossible d'extraire les informations du bucket depuis l'URL:", url);
        return false;
      }
      
      console.log(`Téléchargement depuis le bucket: ${bucketInfo.bucket}, path: ${bucketInfo.path}`);
      
      const { data, error } = await supabase.storage
        .from(bucketInfo.bucket)
        .download(bucketInfo.path);
      
      if (error) {
        console.error("Erreur lors du téléchargement depuis Supabase:", error);
        return false;
      }
      
      // Créer un lien de téléchargement pour le blob
      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      return true;
    } 
    // Pour les URLs standards (http/https)
    else if (url.startsWith('http')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      return true;
    }
    else {
      console.error("Format d'URL non supporté:", url);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return false;
  }
};

/**
 * Télécharger un fichier de base de données
 */
export const downloadDatabaseFile = async (url: string, fileName?: string): Promise<boolean> => {
  return downloadFile(url, fileName);
};
