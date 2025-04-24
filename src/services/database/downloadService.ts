
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
    
    // Gérer le cas où l'URL est complète
    let path = filePath;
    let bucketName = 'databases'; // Bucket par défaut
    
    // Si c'est une URL complète, extraire le chemin du fichier
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        const pathSegments = url.pathname.split('/');
        
        // Chercher le segment "storage" et "object" dans l'URL
        const storageIndex = pathSegments.indexOf('storage');
        const objectIndex = pathSegments.indexOf('object');
        const bucketIndex = storageIndex !== -1 && objectIndex !== -1 ? objectIndex + 1 : -1;
        
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length) {
          bucketName = pathSegments[bucketIndex];
          path = pathSegments.slice(bucketIndex + 1).join('/');
          console.log(`Bucket extrait: ${bucketName}, chemin: ${path}`);
        } else {
          // Ancienne méthode pour la rétrocompatibilité
          const databasesIndex = pathSegments.findIndex(s => s === 'databases');
          if (databasesIndex !== -1 && databasesIndex < pathSegments.length - 1) {
            path = pathSegments.slice(databasesIndex + 1).join('/');
            console.log(`Chemin extrait (ancienne méthode): ${path}`);
          } else {
            console.error("Format d'URL non reconnu");
            toast.error("Format d'URL incorrect");
            return false;
          }
        }
      } catch (urlError) {
        console.error("Erreur lors du traitement de l'URL:", urlError);
        toast.error("URL de fichier malformée");
        return false;
      }
    }
    
    console.log(`Téléchargement du fichier: ${path} depuis le bucket '${bucketName}'`);
    
    // Télécharger directement depuis le bucket de stockage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      toast.error(`Erreur: ${error.message}`);
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
