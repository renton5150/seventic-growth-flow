
import { supabase } from "@/integrations/supabase/client";

export const extractFileName = (url: string): string => {
  try {
    const pathSegments = new URL(url).pathname.split('/');
    return decodeURIComponent(pathSegments[pathSegments.length - 1]);
  } catch {
    return 'document';
  }
};

export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    if (!url) return false;
    
    // Extraire le chemin du fichier de l'URL
    const path = url.split('/').slice(-2).join('/');
    if (!path) return false;
    
    const { data, error } = await supabase.storage
      .from('databases')
      .list('uploads', {
        search: path
      });
    
    if (error) {
      console.error("Erreur lors de la vérification du fichier:", error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};

export const downloadFile = async (url: string, fileName: string = 'document'): Promise<boolean> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
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

    // Pour les URL complètes de Supabase Storage
    if (url.includes('/storage/v1/object/public/')) {
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
      if (match && match.length >= 3) {
        return {
          bucketName: match[1],
          filePath: match[2]
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
        return {
          bucketName: bucket,
          filePath: path
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin:", error);
    return null;
  }
};
