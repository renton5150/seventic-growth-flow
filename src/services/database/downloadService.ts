
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
    
    // Déterminer le bucket et le chemin du fichier
    const { bucketName, path } = extractBucketAndPath(filePath);
    
    console.log(`Téléchargement du fichier: ${path} depuis le bucket '${bucketName}'`);
    
    // Vérifier d'abord si le fichier existe
    const { data: fileExists, error: existError } = await supabase.storage
      .from(bucketName)
      .list(path.split('/').slice(0, -1).join('/'), {
        limit: 100,
        offset: 0,
        search: path.split('/').pop()
      });
    
    if (existError) {
      console.error('Erreur lors de la vérification de l\'existence du fichier:', existError);
      toast.error(`Erreur: ${existError.message || 'Fichier introuvable'}`);
      return false;
    }
    
    if (!fileExists || fileExists.length === 0) {
      console.error('Fichier non trouvé dans le bucket:', path);
      toast.error("Fichier introuvable dans le stockage");
      return false;
    }
    
    // Télécharger directement depuis le bucket de stockage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
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
  let bucketName = 'databases'; // Bucket par défaut
  
  // Si c'est une URL complète, extraire le chemin du fichier
  if (filePath.startsWith('http')) {
    try {
      const url = new URL(filePath);
      const pathSegments = url.pathname.split('/');
      
      // Chercher les segments dans l'URL pour déterminer le bucket et le chemin
      if (pathSegments.includes('storage') && pathSegments.includes('object')) {
        // Format moderne: /storage/v1/object/{bucket}/{path}
        const objectIndex = pathSegments.indexOf('object');
        
        if (objectIndex !== -1 && objectIndex + 1 < pathSegments.length) {
          bucketName = pathSegments[objectIndex + 1];
          path = pathSegments.slice(objectIndex + 2).join('/');
          console.log(`Format moderne - Bucket: ${bucketName}, Path: ${path}`);
        }
      } else if (pathSegments.includes('storage') && pathSegments.includes('sign')) {
        // Format signé: /storage/v1/sign/{token}
        // Dans ce cas, nous devons utiliser une approche différente
        // car nous n'avons pas accès direct au chemin du fichier
        console.log(`URL signée détectée - Utilisation du téléchargement direct via URL`);
        return { bucketName: 'direct', path: filePath };
      } else {
        // Essayer d'identifier un segment qui pourrait être un nom de bucket connu
        const bucketCandidates = ['databases', 'uploads'];
        for (const candidate of bucketCandidates) {
          const index = pathSegments.indexOf(candidate);
          if (index !== -1) {
            bucketName = candidate;
            path = pathSegments.slice(index).join('/');
            console.log(`Bucket candidat trouvé - Bucket: ${bucketName}, Path: ${path}`);
            break;
          }
        }
      }
    } catch (urlError) {
      console.error("Erreur lors du traitement de l'URL:", urlError);
      
      // Fallback: utiliser le chemin tel quel
      path = filePath;
      console.log(`URL mal formée - Utilisation du chemin brut: ${path}`);
    }
  } else if (filePath.startsWith('uploads/')) {
    // C'est un chemin relatif qui commence par 'uploads/'
    path = filePath;
    console.log(`Chemin relatif - Path: ${path}`);
  }
  
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
