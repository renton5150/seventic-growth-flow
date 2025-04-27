
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
