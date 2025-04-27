
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

// Vérifier si un fichier existe dans un bucket
export const checkFileExists = async (bucketName: string, filePath: string): Promise<boolean> => {
  try {
    console.log(`Vérification de l'existence du fichier: bucket=${bucketName}, path=${filePath}`);
    
    // Séparer le chemin du dossier et le nom de fichier
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop() || '';
    const folderPath = pathParts.join('/');
    
    console.log(`Dossier: ${folderPath}, Fichier: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        search: fileName,
        limit: 1
      });
    
    if (error) {
      console.error("Erreur lors de la vérification du fichier:", error);
      return false;
    }
    
    const fileExists = data && data.length > 0;
    console.log(`Résultat de la vérification: ${fileExists ? 'Fichier trouvé' : 'Fichier non trouvé'}`);
    return fileExists;
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};
