import { supabase } from "@/integrations/supabase/client";

/**
 * Extrait le nom du bucket et le chemin du fichier à partir d'une URL Supabase Storage
 * @param url URL Supabase Storage
 * @returns Objet contenant le nom du bucket et le chemin du fichier
 */
export const extractPathFromSupabaseUrl = (url: string): { bucketName: string; filePath: string } | null => {
  try {
    if (!url) return null;
    
    // Format: https://<domain>/storage/v1/object/public/<bucket>/<path>
    if (url.includes('/storage/v1/object/public/')) {
      const parts = url.split('/storage/v1/object/public/');
      if (parts.length < 2) return null;
      
      const pathParts = parts[1].split('/');
      const bucketName = pathParts[0];
      const filePath = pathParts.slice(1).join('/');
      
      return { bucketName, filePath };
    }
    // Format: https://<domain>/storage/v1/object/sign/<bucket>/<path>
    else if (url.includes('/storage/v1/object/sign/')) {
      const parts = url.split('/storage/v1/object/sign/');
      if (parts.length < 2) return null;
      
      const pathParts = parts[1].split('/');
      const bucketName = pathParts[0];
      const filePath = pathParts.slice(1).join('/').split('?')[0]; // Enlever les paramètres d'URL
      
      return { bucketName, filePath };
    }
    // Autres formats d'URL Supabase Storage
    else if (url.includes('/storage/v1/')) {
      const parts = url.split('/storage/v1/');
      if (parts.length < 2) return null;
      
      const subParts = parts[1].split('/');
      if (subParts.length < 2) return null;
      
      const bucketName = subParts[1];
      const filePath = subParts.slice(2).join('/').split('?')[0]; // Enlever les paramètres d'URL
      
      return { bucketName, filePath };
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin à partir de l'URL:", error);
    return null;
  }
};

/**
 * Extrait le nom de fichier d'une URL
 * @param url URL du fichier
 * @returns Nom du fichier ou null si l'extraction échoue
 */
export const extractFileName = (url: string): string | null => {
  try {
    // Récupérer le dernier segment de l'URL (après le dernier '/')
    const segments = url.split('/');
    let fileName = segments[segments.length - 1];
    
    // Si l'URL contient des paramètres, les supprimer
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }
    
    // Décoder le nom du fichier au cas où il contiendrait des caractères spéciaux encodés
    fileName = decodeURIComponent(fileName);
    
    return fileName || null;
  } catch (e) {
    console.error("Erreur lors de l'extraction du nom de fichier:", e);
    return null;
  }
};

/**
 * Vérifie si un fichier existe à l'URL spécifiée
 * @param url URL du fichier à vérifier
 * @returns Promise<boolean> indiquant si le fichier existe
 */
export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    // Pour les URLs de stockage Supabase
    if (url.includes('storage/v1')) {
      // Extraire les informations du chemin à partir de l'URL
      const pathInfo = extractPathFromSupabaseUrl(url);
      
      if (!pathInfo) {
        console.error("Impossible d'extraire les informations de chemin à partir de l'URL:", url);
        return false;
      }
      
      // Vérifier l'existence du fichier via l'API Supabase
      const { data, error } = await supabase.storage
        .from(pathInfo.bucketName)
        .list(pathInfo.filePath.split('/').slice(0, -1).join('/') || undefined);
      
      if (error) {
        console.error("Erreur lors de la vérification via Supabase:", error);
        return false;
      }
      
      // Vérifier si le fichier est dans la liste
      const fileName = pathInfo.filePath.split('/').pop();
      return data.some(file => file.name === fileName);
    } 
    // Pour les URLs standards (http/https)
    else if (url.startsWith('http')) {
      // Utiliser un HEAD request pour vérifier l'existence
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
    else {
      console.error("Format d'URL non supporté pour la vérification:", url);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};

/**
 * Téléchargement générique de fichier
 */
export const downloadFile = async (url: string, fileName: string): Promise<boolean> => {
  try {
    // Pour les URLs de stockage Supabase
    if (url.includes('storage/v1')) {
      const pathInfo = extractPathFromSupabaseUrl(url);
      if (!pathInfo) {
        console.error("Impossible d'extraire les informations de chemin à partir de l'URL:", url);
        return false;
      }
      
      const { data, error } = await supabase.storage
        .from(pathInfo.bucketName)
        .download(pathInfo.filePath);
      
      if (error) {
        console.error("Erreur lors du téléchargement depuis Supabase:", error);
        return false;
      }
      
      // Créer un lien de téléchargement pour le blob
      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } 
    // Pour les URLs standards (http/https)
    else if (url.startsWith('http')) {
      // Utiliser fetch pour récupérer le fichier
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
