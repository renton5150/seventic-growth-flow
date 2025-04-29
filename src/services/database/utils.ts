
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
      console.warn("Impossible d'extraire les informations de chemin pour:", url);
      return false;
    }
    
    console.log(`Vérification dans le bucket ${pathInfo.bucketName}, chemin: ${pathInfo.filePath}`);
    
    // Pour les URLs complètes de Supabase, utiliser directement l'URL pour vérifier l'existence
    if (url.includes('/storage/v1/object/public/')) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const exists = response.ok;
        console.log(`Vérification directe de l'URL ${url}: ${exists}`);
        return exists;
      } catch (err) {
        console.error("Erreur lors de la vérification directe:", err);
      }
    }
    
    // Obtenir le répertoire parent et le nom du fichier pour la recherche
    const filePath = pathInfo.filePath;
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop() || '';
    const directory = pathParts.join('/');
    
    console.log(`Recherche du fichier ${fileName} dans le répertoire ${directory || '.'}`);
    
    // Essayer d'obtenir le fichier directement
    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from(pathInfo.bucketName)
        .download(filePath);
      
      if (!fileError && fileData) {
        console.log(`Le fichier existe (download direct): ${filePath}`);
        return true;
      }
    } catch (downloadErr) {
      console.log("Erreur lors du téléchargement direct:", downloadErr);
    }
    
    // Fallback: essayer de lister les fichiers
    const { data, error } = await supabase.storage
      .from(pathInfo.bucketName)
      .list(directory || '.', {
        search: fileName
      });
    
    if (error) {
      console.error("Erreur lors de la vérification du fichier:", error);
      return false;
    }
    
    const exists = data && data.some(item => item.name === fileName);
    console.log(`Le fichier '${fileName}' existe:`, exists, data ? data.map(d => d.name) : "Aucune donnée");
    
    // Si le fichier n'est pas trouvé avec le nom exact, essayons de chercher avec le nom URL-décodé
    if (!exists && fileName.includes('%')) {
      try {
        const decodedFileName = decodeURIComponent(fileName);
        const existsDecoded = data && data.some(item => item.name === decodedFileName);
        console.log(`Le fichier décodé '${decodedFileName}' existe:`, existsDecoded);
        return existsDecoded;
      } catch (e) {
        console.error("Erreur lors du décodage du nom de fichier:", e);
      }
    }
    
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

    // 1. Pour les URL complètes de Supabase Storage
    if (url.includes('/storage/v1/object/public/')) {
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
      if (match && match.length >= 3) {
        const bucketName = match[1];
        let filePath = match[2];
        
        // Décode le chemin du fichier pour gérer les espaces et caractères spéciaux
        try {
          filePath = decodeURIComponent(filePath);
        } catch (e) {
          console.warn("Erreur lors du décodage du chemin:", e);
        }
        
        console.log(`Chemin extrait (URL complète) - Bucket: ${bucketName}, Fichier: ${filePath}`);
        return { bucketName, filePath };
      }
    }
    
    // 2. Pour les chemins relatifs avec format "bucket/path"
    const segments = url.split('/');
    if (segments.length >= 2) {
      const bucketName = segments[0];
      const filePath = segments.slice(1).join('/');
      
      if (bucketName && filePath) {
        console.log(`Chemin relatif extrait - Bucket: ${bucketName}, Fichier: ${filePath}`);
        return { bucketName, filePath };
      }
    }
    
    // 3. Pour les fichiers de base de données avec un pattern spécifique
    if (/^\d+_[a-zA-Z0-9-_]+\.[a-zA-Z0-9]+$/.test(url) || url.includes('database')) {
      console.log(`Format de base de données détecté: ${url}`);
      return {
        bucketName: 'databases',
        filePath: url
      };
    }
    
    // 4. Si rien d'autre ne correspond, traiter comme un chemin direct dans le bucket approprié
    if (url.includes('blacklist')) {
      return {
        bucketName: 'blacklists',
        filePath: url
      };
    }
    
    // Dernier recours: considérer comme un chemin direct dans le bucket "databases"
    console.log(`Aucun format reconnu, traitement comme chemin direct: ${url}`);
    return {
      bucketName: 'databases',
      filePath: url
    };
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin:", error);
    return null;
  }
};
