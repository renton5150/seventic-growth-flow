
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
    
    // Gérer le cas où l'URL est complète ou juste un chemin relatif
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
          const storageIndex = pathSegments.indexOf('storage');
          const objectIndex = pathSegments.indexOf('object');
          
          if (objectIndex !== -1 && objectIndex + 1 < pathSegments.length) {
            bucketName = pathSegments[objectIndex + 1];
            path = pathSegments.slice(objectIndex + 2).join('/');
            console.log(`Format moderne - Bucket: ${bucketName}, Path: ${path}`);
          }
        } else if (pathSegments.includes('databases')) {
          // Format ancien: /storage/v1/object/sign/{path}
          const databasesIndex = pathSegments.indexOf('databases');
          if (databasesIndex !== -1) {
            bucketName = 'databases';
            path = pathSegments.slice(databasesIndex).join('/');
            console.log(`Format ancien - Path: ${path}`);
          }
        } else {
          // Format inconnu, essayer d'extraire le dernier segment comme nom de fichier
          path = pathSegments[pathSegments.length - 1];
          console.log(`Format inconnu - Utilisation du dernier segment: ${path}`);
        }
      } catch (urlError) {
        console.error("Erreur lors du traitement de l'URL:", urlError);
        
        // Fallback: utiliser le chemin tel quel si c'est une URL mal formée
        path = filePath;
        console.log(`URL mal formée - Utilisation du chemin brut: ${path}`);
      }
    } else if (filePath.startsWith('uploads/')) {
      // C'est un chemin relatif qui commence par 'uploads/'
      path = filePath;
      bucketName = 'databases'; // Bucket par défaut pour les uploads
      console.log(`Chemin relatif - Bucket: ${bucketName}, Path: ${path}`);
    }
    
    console.log(`Téléchargement du fichier: ${path} depuis le bucket '${bucketName}'`);
    
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
