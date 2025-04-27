
import { supabase } from "@/integrations/supabase/client";

// Obtenir l'URL publique d'un fichier
export const getPublicFileUrl = (bucketName: string, filePath: string): string => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data?.publicUrl || '';
};

// Extraire le nom du fichier depuis une URL ou un chemin
export const extractFileName = (path: string): string => {
  if (!path) return 'document';
  
  // Gérer les URL complètes
  if (path.startsWith('http')) {
    try {
      const url = new URL(path);
      const pathSegments = url.pathname.split('/');
      const rawFileName = pathSegments[pathSegments.length - 1] || 'document';
      return decodeURIComponent(rawFileName);
    } catch (e) {
      // Si l'URL est invalide, essayer de récupérer le dernier segment
      const segments = path.split('/');
      const rawFileName = segments[segments.length - 1] || 'document';
      return decodeURIComponent(rawFileName);
    }
  } 
  
  // Pour les chemins relatifs
  const segments = path.split('/');
  const rawFileName = segments[segments.length - 1] || 'document';
  return decodeURIComponent(rawFileName);
};

// Extraire le chemin du fichier à partir d'une URL Supabase complète
export const extractPathFromSupabaseUrl = (fileUrl: string): {bucketName: string, filePath: string} | null => {
  try {
    console.log("Extraction du chemin à partir de l'URL:", fileUrl);
    
    // Format standard de l'URL Supabase: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filePath>
    if (fileUrl.includes('/storage/v1/object/public/')) {
      const parts = fileUrl.split('/storage/v1/object/public/');
      if (parts.length > 1) {
        const restPath = parts[1];
        const firstSlash = restPath.indexOf('/');
        
        // Si aucun slash n'est trouvé, le bucket existe sans chemin
        if (firstSlash === -1) {
          return {
            bucketName: restPath,
            filePath: ''
          };
        }
        
        const bucketName = restPath.substring(0, firstSlash);
        const filePath = restPath.substring(firstSlash + 1);
        
        console.log(`URL analysée - Bucket: ${bucketName}, Chemin: ${filePath}`);
        return {
          bucketName,
          filePath
        };
      }
    } 
    
    // Si c'est simplement un chemin sans URL complète (uploads/...)
    else if (!fileUrl.includes('http')) {
      return {
        bucketName: 'databases',  // bucket par défaut
        filePath: fileUrl
      };
    }
    
    console.log("Impossible d'extraire le chemin de l'URL:", fileUrl);
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin depuis l'URL:", error);
    return null;
  }
};

// Vérifier si un fichier existe dans un bucket
export const checkFileExists = async (fileUrl: string): Promise<boolean> => {
  try {
    // Si l'URL est vide, le fichier n'existe pas
    if (!fileUrl) {
      return false;
    }
    
    console.log(`Vérification de l'existence du fichier: ${fileUrl}`);
    
    // 1. Essayer d'extraire le bucket et le chemin
    const pathInfo = extractPathFromSupabaseUrl(fileUrl);
    
    // Si on ne peut pas extraire l'information du chemin, on vérifie si c'est une URL externe
    if (!pathInfo) {
      // Pour les URLs externes (non Supabase), essayer un fetch
      if (fileUrl.startsWith('http')) {
        try {
          const response = await fetch(fileUrl, { method: 'HEAD' });
          return response.ok;
        } catch {
          return false;
        }
      }
      return false;
    }
    
    const { bucketName, filePath } = pathInfo;
    
    // 2. Si c'est un chemin direct sans bucket, utiliser le bucket par défaut
    const bucket = bucketName || 'databases';
    const path = filePath || fileUrl;
    
    console.log(`Vérification dans le bucket ${bucket} avec le chemin: ${path}`);
    
    // 3. Vérifier dans le stockage Supabase
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (error) {
        console.log(`Erreur lors de la vérification du fichier: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification du fichier:", error);
      return false;
    }
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification du fichier:", error);
    return false;
  }
};

// Construire l'URL publique d'un fichier dans le bucket de stockage
export const buildStorageUrl = (bucketName: string, filePath: string): string => {
  // Si le chemin est déjà une URL complète, la retourner
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Sinon, construire l'URL avec l'API Supabase
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data?.publicUrl || '';
};
