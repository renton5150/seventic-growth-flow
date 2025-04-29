
import { supabase } from "@/integrations/supabase/client";

export const extractFileName = (url: string): string => {
  try {
    console.log("Extraction du nom de fichier à partir de l'URL:", url);
    // Essayer d'extraire à partir d'une URL complète
    const pathSegments = new URL(url).pathname.split('/');
    const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1]);
    console.log("Nom de fichier extrait:", fileName);
    return fileName;
  } catch (error) {
    // Si l'URL n'est pas valide, essayons d'extraire le nom de fichier à partir du chemin
    try {
      const pathParts = url.split('/');
      const fileName = pathParts[pathParts.length - 1];
      console.log("Nom de fichier extrait en mode fallback:", fileName);
      return fileName;
    } catch (e) {
      console.error("Erreur lors de l'extraction du nom de fichier:", e);
      return 'document';
    }
  }
};

export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    if (!url) return false;
    console.log("Vérification de l'existence du fichier:", url);
    
    // Extraire le chemin du fichier de l'URL
    const pathInfo = extractPathFromSupabaseUrl(url);
    if (!pathInfo) {
      console.warn("Impossible d'extraire les informations de chemin");
      return false;
    }
    
    console.log(`Vérification dans le bucket ${pathInfo.bucketName}, chemin: ${pathInfo.filePath}`);
    
    const { data, error } = await supabase.storage
      .from(pathInfo.bucketName)
      .list(pathInfo.filePath.split('/').slice(0, -1).join('/') || '.', {
        search: pathInfo.filePath.split('/').pop() || ''
      });
    
    if (error) {
      console.error("Erreur lors de la vérification du fichier:", error);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log("Le fichier existe:", exists);
    return exists;
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};

export const downloadFile = async (url: string, fileName: string = 'document'): Promise<boolean> => {
  try {
    console.log(`Téléchargement du fichier: ${url} avec le nom ${fileName}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Erreur de réponse HTTP:", response.status, response.statusText);
      return false;
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log("Téléchargement terminé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return false;
  }
};

/**
 * Extrait les informations de chemin d'une URL Supabase Storage
 * @param url L'URL à analyser
 * @returns Un objet contenant le nom du bucket et le chemin du fichier, ou null si l'URL n'est pas valide
 */
export const extractPathFromSupabaseUrl = (url: string): { bucketName: string; filePath: string } | null => {
  try {
    if (!url) return null;
    console.log("Extraction du chemin à partir de l'URL:", url);

    // Pour les URL complètes de Supabase Storage
    if (url.includes('/storage/v1/object/public/')) {
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
      if (match && match.length >= 3) {
        console.log(`Chemin extrait - Bucket: ${match[1]}, Fichier: ${match[2]}`);
        return {
          bucketName: match[1],
          filePath: match[2]
        };
      }
    }
    
    // Pour les chemins relatifs à un bucket connu
    const knownBuckets = ['databases', 'templates', 'blacklists'];
    for (const bucket of knownBuckets) {
      if (url.startsWith(`${bucket}/`) || url === bucket) {
        const path = url.replace(`${bucket}/`, '');
        console.log(`Chemin relatif connu - Bucket: ${bucket}, Fichier: ${path}`);
        return {
          bucketName: bucket,
          filePath: path
        };
      }
    }
    
    // Pour les chemins relatifs
    const segments = url.split('/');
    if (segments.length >= 2) {
      // On suppose que le premier segment est le bucket et le reste est le chemin
      const bucket = segments[0];
      const path = segments.slice(1).join('/');
      
      if (bucket && path) {
        console.log(`Chemin relatif extrait - Bucket: ${bucket}, Fichier: ${path}`);
        return {
          bucketName: bucket,
          filePath: path
        };
      }
    }
    
    console.warn("Impossible d'extraire les informations de chemin");
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin:", error);
    return null;
  }
};
