
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
    
    // Si le chemin n'a pas de dossier parent (fichier à la racine du bucket)
    const folderPath = path.includes('/') ? path.split('/').slice(0, -1).join('/') : '';
    const fileNameFromPath = path.split('/').pop() || '';
    
    // Vérifier d'abord si le fichier existe
    const { data: fileList, error: existError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        search: fileNameFromPath
      });
    
    if (existError) {
      console.error('Erreur lors de la vérification de l\'existence du fichier:', existError);
      toast.error(`Erreur: ${existError.message || 'Fichier introuvable'}`);
      return false;
    }
    
    if (!fileList || fileList.length === 0) {
      console.error(`Fichier "${fileNameFromPath}" non trouvé dans le bucket: "${bucketName}" au chemin "${folderPath}"`);
      toast.error("Fichier introuvable dans le stockage");
      return false;
    }
    
    // Trouver le fichier exact dans la liste
    const exactFile = fileList.find(file => file.name === fileNameFromPath);
    if (!exactFile) {
      console.error(`Fichier exact "${fileNameFromPath}" non trouvé dans la liste des fichiers disponibles`);
      console.log('Fichiers disponibles:', fileList.map(f => f.name).join(', '));
      toast.error("Fichier exact introuvable dans le dossier");
      return false;
    }
    
    console.log(`Fichier trouvé: ${exactFile.name}, taille: ${exactFile.metadata?.size || 'inconnue'}`);
    
    // Télécharger directement depuis le bucket de stockage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      
      // Tentative alternative avec URL publique
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
      
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
    
    // Créer un URL objet pour le téléchargement
    const blobUrl = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.href = blobUrl;
    
    // Utiliser le nom de fichier fourni ou extraire du chemin
    const downloadFileName = fileName || path.split('/').pop() || "document";
    element.download = decodeURIComponent(downloadFileName);
    
    // Déclencher le téléchargement
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée après le téléchargement
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 500);
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error('Erreur lors du téléchargement:', error);
    toast.error(`Erreur de téléchargement: ${errorMessage}`);
    return false;
  }
};

/**
 * Extrait le nom du bucket et le chemin du fichier à partir d'une URL ou d'un chemin
 */
const extractBucketAndPath = (filePath: string): { bucketName: string; path: string } => {
  let path = filePath;
  // Liste des buckets possibles dans l'ordre de priorité
  const knownBuckets = ['databases', 'uploads', 'templates', 'blacklists'];
  let bucketName = knownBuckets[0]; // Par défaut 'databases'
  
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
      
      // Si aucun bucket connu n'est trouvé dans l'URL
      console.log("Aucun bucket connu trouvé dans l'URL, utilisation du chemin brut");
    } catch (urlError) {
      console.error("Erreur lors du traitement de l'URL:", urlError);
    }
  } 
  
  // Si c'est un chemin relatif ou si l'URL n'a pas été analysée avec succès
  // Vérifier si le chemin contient un nom de bucket connu
  for (const bucket of knownBuckets) {
    if (path.startsWith(`${bucket}/`)) {
      bucketName = bucket;
      path = path.substring(bucket.length + 1); // +1 pour le slash
      console.log(`Chemin relatif avec bucket: ${bucketName}, sous-chemin: ${path}`);
      return { bucketName, path };
    }
  }
  
  // Si aucun bucket n'a été identifié dans le chemin, utiliser le premier bucket connu
  if (path.startsWith('/')) {
    path = path.substring(1); // Supprimer le slash initial si présent
  }
  
  console.log(`Aucun bucket identifié, utilisation par défaut: ${bucketName}, chemin: ${path}`);
  return { bucketName, path };
};

/**
 * Télécharge un fichier directement via une URL
 * Cette méthode alternative est utilisée lorsque nous avons une URL signée
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
    const blobUrl = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = blobUrl;
    element.download = fileName;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement direct:', error);
    toast.error(`Erreur lors du téléchargement direct: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
};
