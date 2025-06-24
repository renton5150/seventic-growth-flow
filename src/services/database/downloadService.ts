
import { extractPathFromSupabaseUrl } from './utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      
      // Liste des buckets à essayer dans l'ordre de priorité pour les listes noires
      const bucketsToTry = ['blacklists', 'requests', 'databases', 'templates'];
      
      // Diagnostic : lister le contenu de chaque bucket pour traçabilité
      for (const bucket of bucketsToTry) {
        console.log(`[downloadFile:${requestId}] === Diagnostic du bucket: ${bucket} ===`);
        try {
          const { data: bucketFiles, error: listError } = await supabase.storage
            .from(bucket)
            .list('', { limit: 100 });
          
          if (!listError && bucketFiles) {
            console.log(`[downloadFile:${requestId}] Fichiers dans ${bucket}:`, bucketFiles.map(f => f.name));
            // Chercher si notre fichier existe
            const foundFile = bucketFiles.find(f => f.name === filePath || f.name.includes(filePath.split('_').slice(-1)[0]));
            if (foundFile) {
              console.log(`[downloadFile:${requestId}] 🎯 Fichier potentiel trouvé dans ${bucket}: ${foundFile.name}`);
            }
          } else {
            console.log(`[downloadFile:${requestId}] Erreur lors du listing de ${bucket}:`, listError);
          }
        } catch (err) {
          console.log(`[downloadFile:${requestId}] Exception lors du listing de ${bucket}:`, err);
        }
      }
      
      // Maintenant essayer de télécharger depuis chaque bucket
      for (const bucket of bucketsToTry) {
        console.log(`[downloadFile:${requestId}] 📥 Tentative de téléchargement depuis le bucket: ${bucket}`);
        
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (!error && data) {
            console.log(`[downloadFile:${requestId}] ✅ Fichier trouvé et téléchargé depuis le bucket: ${bucket}`);
            const blob = new Blob([data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success(`Fichier "${fileName}" téléchargé avec succès depuis ${bucket}`);
            return true;
          }
          
          console.log(`[downloadFile:${requestId}] ❌ Fichier non trouvé dans ${bucket}:`, error?.message || 'Aucune erreur spécifique');
        } catch (err) {
          console.log(`[downloadFile:${requestId}] ⚠️ Exception avec le bucket ${bucket}:`, err);
          continue;
        }
      }
      
      // Si aucun bucket n'a fonctionné, essayer des variantes du nom de fichier
      console.log(`[downloadFile:${requestId}] 🔍 Essai de variantes du nom de fichier...`);
      
      // Extraire le nom réel du fichier depuis le temp_
      let realFileName = filePath;
      if (filePath.startsWith('temp_')) {
        const parts = filePath.split('_');
        if (parts.length >= 3) {
          realFileName = parts.slice(2).join('_');
          console.log(`[downloadFile:${requestId}] Nom réel extrait: ${realFileName}`);
          
          // Réessayer avec le nom réel dans les buckets prioritaires
          for (const bucket of ['blacklists', 'requests']) {
            try {
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(realFileName);
              
              if (!error && data) {
                console.log(`[downloadFile:${requestId}] ✅ Fichier trouvé avec nom réel dans ${bucket}`);
                const blob = new Blob([data]);
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                toast.success(`Fichier "${fileName}" téléchargé avec succès`);
                return true;
              }
            } catch (err) {
              console.log(`[downloadFile:${requestId}] Exception avec nom réel dans ${bucket}:`, err);
            }
          }
        }
      }
      
      // Si toujours aucun résultat
      console.error(`[downloadFile:${requestId}] ❌ ÉCHEC COMPLET - Fichier non trouvé dans aucun bucket pour: ${fileUrl}`);
      console.log(`[downloadFile:${requestId}] Chemin recherché: ${filePath}`);
      console.log(`[downloadFile:${requestId}] Nom réel recherché: ${realFileName}`);
      
      toast.error(`Fichier "${fileName}" non trouvé dans le stockage. Vérifiez que le fichier existe.`);
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
