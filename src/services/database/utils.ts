
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
      return pathSegments[pathSegments.length - 1] || 'document';
    } catch (e) {
      // Si l'URL est invalide, essayer de récupérer le dernier segment
      const segments = path.split('/');
      return segments[segments.length - 1] || 'document';
    }
  } 
  
  // Pour les chemins relatifs
  const segments = path.split('/');
  return segments[segments.length - 1] || 'document';
};
