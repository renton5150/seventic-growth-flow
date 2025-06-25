
// Fonctions utilitaires pour la gestion des fichiers de base de données

/**
 * Extraire le chemin d'un fichier depuis une URL Supabase
 */
export const extractPathFromSupabaseUrl = (url: string): string | null => {
  try {
    // Pattern pour les URLs Supabase Storage: /storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin:", error);
    return null;
  }
};

/**
 * Extraire le nom de fichier d'une URL - version robuste
 */
export const extractFileName = (url: string | string[]): string => {
  try {
    // Si c'est un tableau, prendre le premier élément
    const urlString = Array.isArray(url) ? url[0] : url || '';
    
    if (!urlString || typeof urlString !== 'string') {
      return 'fichier.xlsx';
    }
    
    // Récupérer le dernier segment de l'URL (après le dernier '/')
    const segments = urlString.split('/');
    let fileName = segments[segments.length - 1];
    
    // Si l'URL contient des paramètres, les supprimer
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }
    
    // Décoder le nom du fichier au cas où il contiendrait des caractères spéciaux encodés
    fileName = decodeURIComponent(fileName);
    
    return fileName || 'fichier.xlsx';
  } catch (error) {
    console.error("Erreur lors de l'extraction du nom de fichier:", error);
    return 'fichier.xlsx';
  }
};

/**
 * Vérifier si un fichier existe
 */
export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // Pour les URLs de stockage Supabase, on suppose qu'elles existent si elles sont bien formées
    if (url.includes('storage/v1/object/public')) {
      return true;
    }
    
    // Pour les URLs standards, faire une requête HEAD
    if (url.startsWith('http')) {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};
