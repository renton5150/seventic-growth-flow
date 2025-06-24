
import { extractPathFromSupabaseUrl } from './utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fonction pour normaliser et extraire les mots-clés d'un nom de fichier
 */
const extractKeywords = (filename: string): string[] => {
  // Supprimer les extensions et les préfixes timestamp
  let cleanName = filename.replace(/\.(xlsx?|csv|txt)$/i, '');
  cleanName = cleanName.replace(/^temp_\d+_/, '');
  
  // Extraire les mots significatifs (longueur >= 3)
  const words = cleanName.split(/[_\-\s\.]+/).filter(word => word.length >= 3);
  return words.map(word => word.toLowerCase());
};

/**
 * Fonction pour calculer la similarité entre deux ensembles de mots-clés
 */
const calculateSimilarity = (keywords1: string[], keywords2: string[]): number => {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const matches = keywords1.filter(word => 
    keywords2.some(keyword => keyword.includes(word) || word.includes(keyword))
  );
  
  return matches.length / Math.max(keywords1.length, keywords2.length);
};

/**
 * Recherche intelligente de fichiers dans tous les buckets
 */
const findFileInAllBuckets = async (targetFilename: string, requestId: string): Promise<{bucket: string, filename: string} | null> => {
  const buckets = ['blacklists', 'requests', 'databases', 'templates'];
  const targetKeywords = extractKeywords(targetFilename);
  
  console.log(`[findFile:${requestId}] Recherche de "${targetFilename}" avec mots-clés:`, targetKeywords);
  
  let bestMatch: {bucket: string, filename: string, similarity: number} | null = null;
  
  for (const bucket of buckets) {
    try {
      console.log(`[findFile:${requestId}] 🔍 Exploration du bucket: ${bucket}`);
      
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 100 });
      
      if (error || !files) {
        console.log(`[findFile:${requestId}] Erreur ou aucun fichier dans ${bucket}:`, error?.message);
        continue;
      }
      
      console.log(`[findFile:${requestId}] Fichiers dans ${bucket}:`, files.map(f => f.name));
      
      // Recherche exacte d'abord
      const exactMatch = files.find(f => f.name === targetFilename);
      if (exactMatch) {
        console.log(`[findFile:${requestId}] ✅ Match exact trouvé dans ${bucket}: ${exactMatch.name}`);
        return { bucket, filename: exactMatch.name };
      }
      
      // Recherche par similarité
      for (const file of files) {
        const fileKeywords = extractKeywords(file.name);
        const similarity = calculateSimilarity(targetKeywords, fileKeywords);
        
        console.log(`[findFile:${requestId}] Similarité entre "${targetFilename}" et "${file.name}": ${similarity.toFixed(2)}`);
        
        if (similarity > 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { bucket, filename: file.name, similarity };
          console.log(`[findFile:${requestId}] 🎯 Nouveau meilleur match: ${file.name} dans ${bucket} (${similarity.toFixed(2)})`);
        }
      }
    } catch (err) {
      console.log(`[findFile:${requestId}] Exception lors de l'exploration de ${bucket}:`, err);
    }
  }
  
  if (bestMatch && bestMatch.similarity > 0.5) {
    console.log(`[findFile:${requestId}] ✅ Meilleur match trouvé: ${bestMatch.filename} dans ${bestMatch.bucket}`);
    return { bucket: bestMatch.bucket, filename: bestMatch.filename };
  }
  
  console.log(`[findFile:${requestId}] ❌ Aucun fichier correspondant trouvé`);
  return null;
};

/**
 * Télécharge un fichier à partir d'une URL
 * @param fileUrl URL du fichier à télécharger
 * @param fileName Nom du fichier à utiliser pour le téléchargement
 * @returns Promise<boolean> indiquant si le téléchargement a réussi
 */
export const downloadFile = async (fileUrl: string, fileName: string): Promise<boolean> => {
  try {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[downloadFile:${requestId}] Tentative de téléchargement: ${fileUrl} avec le nom ${fileName}`);
    
    // Vérifier si c'est un fichier temp_ (fichier importé)
    if (fileUrl.startsWith('temp_') || (!fileUrl.startsWith('http') && !fileUrl.startsWith('https://'))) {
      console.log(`[downloadFile:${requestId}] Détection d'un fichier temp ou chemin relatif: ${fileUrl}`);
      
      let filePath = fileUrl;
      
      // Nettoyer le chemin s'il commence par "uploads/"
      if (filePath.startsWith('uploads/')) {
        filePath = filePath.substring(8);
        console.log(`[downloadFile:${requestId}] Chemin nettoyé: ${filePath}`);
      }
      
      // Utiliser la recherche intelligente
      const foundFile = await findFileInAllBuckets(filePath, requestId);
      
      if (foundFile) {
        console.log(`[downloadFile:${requestId}] ✅ Fichier trouvé via recherche intelligente: ${foundFile.filename} dans ${foundFile.bucket}`);
        
        try {
          const { data, error } = await supabase.storage
            .from(foundFile.bucket)
            .download(foundFile.filename);
          
          if (!error && data) {
            const blob = new Blob([data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success(`Fichier "${fileName}" téléchargé avec succès depuis ${foundFile.bucket}`);
            return true;
          }
        } catch (err) {
          console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis ${foundFile.bucket}:`, err);
        }
      }
      
      // Si aucun fichier trouvé
      console.error(`[downloadFile:${requestId}] ❌ ÉCHEC COMPLET - Fichier non trouvé dans aucun bucket pour: ${fileUrl}`);
      toast.error(`Fichier "${fileName}" non trouvé dans le stockage. Le fichier pourrait avoir été supprimé ou déplacé.`);
      return false;
    }
    
    // Logique pour les URLs complètes (nouveaux fichiers) - garde le code existant
    let cleanUrl = fileUrl;
    
    if (fileUrl.includes('?token=')) {
      cleanUrl = fileUrl.split('?token=')[0];
      console.log(`[downloadFile:${requestId}] URL nettoyée: ${cleanUrl}`);
    }
    
    const pathInfo = extractPathFromSupabaseUrl(cleanUrl);
    
    if (pathInfo) {
      console.log(`[downloadFile:${requestId}] URL Supabase analysée - Bucket: ${pathInfo.bucketName}, Chemin: ${pathInfo.filePath}`);
      
      const { data, error } = await supabase.storage
        .from(pathInfo.bucketName)
        .download(pathInfo.filePath);
      
      if (error) {
        console.error(`[downloadFile:${requestId}] Erreur lors du téléchargement depuis Supabase:`, error);
        
        const fallbackBuckets = ['blacklists', 'databases', 'requests'];
        const originalBucket = pathInfo.bucketName;
        
        for (const bucket of fallbackBuckets) {
          if (bucket === originalBucket) continue;
          
          console.log(`[downloadFile:${requestId}] Tentative de fallback vers le bucket: ${bucket}`);
          
          try {
            const { data: fallbackData, error: fallbackError } = await supabase.storage
              .from(bucket)
              .download(pathInfo.filePath);
            
            if (!fallbackError && fallbackData) {
              console.log(`[downloadFile:${requestId}] Fichier trouvé dans le bucket: ${bucket}`);
              const blob = new Blob([fallbackData]);
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
              
              console.log(`[downloadFile:${requestId}] Téléchargement réussi depuis le bucket: ${bucket}`);
              return true;
            }
          } catch (fallbackErr) {
            console.log(`[downloadFile:${requestId}] Erreur avec le bucket ${bucket}:`, fallbackErr);
          }
        }
        
        toast.error(`Erreur: ${error.message}`);
        return false;
      }
      
      if (!data) {
        console.error(`[downloadFile:${requestId}] Aucune donnée reçue de Supabase Storage pour: ${fileUrl}`);
        toast.error("Erreur lors du téléchargement: aucune donnée reçue");
        return false;
      }
      
      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`[downloadFile:${requestId}] Téléchargement depuis Supabase réussi pour: ${fileUrl}`);
      return true;
    }
    
    // Essayer un téléchargement direct via fetch pour les URLs externes
    try {
      console.log(`[downloadFile:${requestId}] Tentative de téléchargement direct via fetch`);
      const response = await fetch(cleanUrl, {
        mode: 'cors',
        headers: {
          'Accept': '*/*',
        }
      });
      
      if (!response.ok) {
        console.log(`[downloadFile:${requestId}] Fetch échoué avec status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        console.log(`[downloadFile:${requestId}] Blob vide reçu`);
        throw new Error("Fichier vide reçu");
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`[downloadFile:${requestId}] Téléchargement direct réussi pour: ${fileUrl}`);
      return true;
    } catch (fetchError) {
      console.error(`[downloadFile:${requestId}] Échec du téléchargement direct:`, fetchError);
      console.error(`[downloadFile:${requestId}] Impossible d'extraire les informations de chemin pour l'URL: ${cleanUrl}`);
      toast.error("Format d'URL non reconnu ou fichier inaccessible");
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    toast.error("Erreur lors du téléchargement");
    return false;
  }
};

// Export avec un nom alternatif pour maintenir la compatibilité
export const downloadDatabaseFile = downloadFile;
