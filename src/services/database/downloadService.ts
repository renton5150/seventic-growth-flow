
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Télécharge un fichier du bucket de stockage Supabase
 * @param filePath Le chemin du fichier dans le bucket ou l'URL complète
 * @param fileName Le nom du fichier à utiliser pour le téléchargement
 * @returns Un booléen indiquant si le téléchargement a réussi
 */
export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}`);
    
    // Vérifier si filePath est vide ou non défini
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      toast.error("Chemin de fichier invalide");
      return false;
    }
    
    // Si c'est une URL complète avec token de signature, essayer le téléchargement direct
    if (filePath.includes("token=") || filePath.includes("sign=")) {
      console.log("URL signée détectée, tentative de téléchargement direct...");
      return await downloadFileFromUrl(filePath, fileName);
    }
    
    // Déterminer le bucket et le chemin du fichier
    const { bucketName, path } = extractBucketAndPath(filePath);
    
    console.log(`Téléchargement du fichier: "${path}" depuis le bucket '${bucketName}'`);

    // Si path ne contient pas de séparateurs de chemin, alors c'est un fichier à la racine
    const folderPath = path.includes('/') ? path.split('/').slice(0, -1).join('/') : '';
    const fileNameFromPath = path.split('/').pop() || '';

    // Liste tous les fichiers dans le bucket pour diagnostic
    console.log(`Listage des fichiers dans le bucket '${bucketName}' chemin '${folderPath}'`);
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (listError) {
      console.error('Erreur lors du listage des fichiers:', listError);
      toast.error(`Erreur de listage: ${listError.message}`);
      return false;
    }

    console.log(`Fichiers trouvés dans '${bucketName}/${folderPath}':`, fileList?.map(f => f.name).join(', ') || 'aucun');

    // Si aucun fichier n'est trouvé, tenter avec un chemin vide
    if (!fileList || fileList.length === 0) {
      console.log(`Aucun fichier trouvé dans '${bucketName}/${folderPath}', tentative avec un chemin vide`);
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from(bucketName)
        .list('');

      if (rootError) {
        console.error('Erreur lors du listage des fichiers à la racine:', rootError);
      } else {
        console.log(`Fichiers à la racine de '${bucketName}':`, rootFiles?.map(f => f.name).join(', ') || 'aucun');
        
        // Recherche du fichier par nom sans tenir compte du chemin
        const matchingFile = rootFiles?.find(f => f.name === fileNameFromPath);
        if (matchingFile) {
          console.log(`Fichier trouvé à la racine: ${matchingFile.name}`);
          
          // Télécharger directement depuis la racine
          const { data, error } = await supabase.storage
            .from(bucketName)
            .download(matchingFile.name);
            
          if (error) {
            console.error('Erreur lors du téléchargement du fichier depuis la racine:', error);
            toast.error(`Erreur: ${error.message}`);
            return false;
          }
          
          if (data) {
            console.log(`Téléchargement réussi depuis la racine pour ${matchingFile.name}`);
            await saveFile(data, fileName);
            return true;
          }
        }
      }
      
      // Essayer toutes les combinaisons possibles de chemins
      return await tryAlternativePaths(bucketName, fileNameFromPath, fileName);
    }
    
    // Trouver le fichier exact dans la liste
    const exactFile = fileList.find(file => file.name === fileNameFromPath);
    if (!exactFile) {
      console.log(`Fichier exact "${fileNameFromPath}" non trouvé dans la liste. Tentative avec le nom seulement.`);
      
      // Essayer de télécharger par nom uniquement
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileNameFromPath);
        
      if (!error && data) {
        console.log(`Téléchargement réussi par nom uniquement pour ${fileNameFromPath}`);
        await saveFile(data, fileName);
        return true;
      }
      
      return await tryAlternativePaths(bucketName, fileNameFromPath, fileName);
    }
    
    console.log(`Fichier trouvé: ${exactFile.name}, tentative de téléchargement`);
    
    // Télécharger depuis le chemin complet
    const fullPath = folderPath ? `${folderPath}/${fileNameFromPath}` : fileNameFromPath;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(fullPath);
    
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      
      // Tentative alternative avec URL publique
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fullPath);
      
      if (publicUrl?.publicUrl) {
        console.log('Tentative de téléchargement via URL publique:', publicUrl.publicUrl);
        return await downloadFileFromUrl(publicUrl.publicUrl, fileName);
      }
      
      toast.error(`Erreur: ${error.message || 'Problème de téléchargement'}`);
      return false;
    }
    
    if (!data) {
      console.error('Aucune donnée reçue pour ce fichier');
      toast.error("Fichier introuvable ou vide");
      return false;
    }
    
    console.log(`Fichier téléchargé avec succès. Taille: ${data.size} octets`);
    return await saveFile(data, fileName);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error('Erreur lors du téléchargement:', error);
    toast.error(`Erreur de téléchargement: ${errorMessage}`);
    return false;
  }
};

/**
 * Essaie plusieurs combinaisons de chemins possibles pour télécharger le fichier
 */
const tryAlternativePaths = async (bucketName: string, fileName: string, downloadName: string): Promise<boolean> => {
  console.log(`Essai de chemins alternatifs pour '${fileName}' dans le bucket '${bucketName}'`);
  
  // Liste des chemins à essayer
  const pathsToTry = [
    fileName,                   // Nom du fichier directement
    `/${fileName}`,             // Avec slash au début
    `${fileName.toLowerCase()}`, // En minuscules
    encodeURIComponent(fileName), // URL encodé
    decodeURIComponent(fileName)  // URL décodé
  ];
  
  // Essayer avec les chemins alternatifs
  for (const path of pathsToTry) {
    console.log(`Tentative avec le chemin: ${path}`);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(path);
        
      if (error) {
        console.log(`Échec avec le chemin ${path}:`, error.message);
        continue;
      }
      
      if (data) {
        console.log(`Succès avec le chemin alternatif: ${path}`);
        await saveFile(data, downloadName);
        return true;
      }
    } catch (e) {
      console.log(`Erreur lors de l'essai du chemin ${path}:`, e);
    }
  }
  
  // Tenter d'utiliser la méthode getPublicUrl comme dernier recours
  try {
    console.log(`Tentative avec getPublicUrl pour ${fileName}`);
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    if (data?.publicUrl) {
      console.log(`URL publique obtenue: ${data.publicUrl}`);
      return await downloadFileFromUrl(data.publicUrl, downloadName);
    }
  } catch (e) {
    console.log('Erreur lors de l\'obtention de l\'URL publique:', e);
  }
  
  toast.error("Impossible de trouver le fichier après plusieurs tentatives");
  return false;
};

/**
 * Sauvegarde un blob en tant que fichier téléchargeable
 */
const saveFile = async (data: Blob, fileName: string): Promise<boolean> => {
  try {
    // Créer un URL objet pour le téléchargement
    const blobUrl = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.href = blobUrl;
    
    // Utiliser le nom de fichier fourni
    element.download = decodeURIComponent(fileName);
    
    // Déclencher le téléchargement
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée après le téléchargement
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 500);
    
    console.log(`Fichier ${fileName} téléchargé avec succès`);
    return true;
  } catch (e) {
    console.error('Erreur lors de la sauvegarde du fichier:', e);
    toast.error("Erreur lors de la sauvegarde du fichier");
    return false;
  }
};

/**
 * Extrait le nom du bucket et le chemin du fichier à partir d'une URL ou d'un chemin
 */
const extractBucketAndPath = (filePath: string): { bucketName: string; path: string } => {
  // Liste des buckets possibles
  const knownBuckets = ['uploads', 'databases', 'templates', 'blacklists', 'storage'];
  let bucketName = 'uploads'; // Par défaut 'uploads'
  let path = filePath;
  
  console.log("Analyse du chemin de fichier:", filePath);
  
  // Si c'est une URL complète, extraire le chemin du fichier
  if (filePath.startsWith('http')) {
    try {
      const url = new URL(filePath);
      const pathSegments = url.pathname.split('/');
      console.log("Segments du chemin dans l'URL:", pathSegments);
      
      // Recherche des segments de bucket connus
      for (const bucket of knownBuckets) {
        const bucketIndex = pathSegments.indexOf(bucket);
        if (bucketIndex !== -1) {
          bucketName = bucket;
          // Le chemin est tout ce qui vient après le nom du bucket
          path = pathSegments.slice(bucketIndex + 1).join('/');
          console.log(`Bucket trouvé dans l'URL: ${bucketName}, chemin: ${path}`);
          return { bucketName, path };
        }
      }
      
      // Si aucun bucket connu n'est trouvé, extraire juste le nom du fichier
      const fileName = pathSegments[pathSegments.length - 1];
      console.log(`Aucun bucket trouvé dans l'URL, utilisation du nom de fichier: ${fileName}`);
      return { bucketName, path: fileName };
    } catch (urlError) {
      console.error("Erreur lors du traitement de l'URL:", urlError);
    }
  }
  
  // Si c'est un chemin relatif, vérifier le format
  for (const bucket of knownBuckets) {
    if (path.startsWith(`${bucket}/`)) {
      bucketName = bucket;
      path = path.substring(bucket.length + 1);
      console.log(`Chemin relatif avec bucket: ${bucketName}, sous-chemin: ${path}`);
      return { bucketName, path };
    }
  }
  
  // Si le chemin commence par un slash, le supprimer
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  // Si aucun bucket identifié, considérer que c'est juste un nom de fichier
  // et rechercher dans le bucket par défaut
  console.log(`Aucun bucket identifié, utilisation par défaut: ${bucketName}, chemin: ${path}`);
  return { bucketName, path };
};

/**
 * Télécharge un fichier directement via une URL
 */
const downloadFileFromUrl = async (url: string, fileName: string): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement direct via URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      toast.error(`Erreur lors du téléchargement: ${response.statusText}`);
      return false;
    }
    
    const blob = await response.blob();
    return await saveFile(blob, fileName);
  } catch (error) {
    console.error('Erreur lors du téléchargement direct:', error);
    toast.error(`Erreur lors du téléchargement direct: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
};
