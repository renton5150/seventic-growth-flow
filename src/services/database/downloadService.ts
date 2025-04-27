
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

    // Si c'est une URL complète avec token de signature ou une URL externe, essayer le téléchargement direct
    if (filePath.startsWith('http') && (filePath.includes("token=") || filePath.includes("sign=") || !filePath.includes('supabase'))) {
      console.log("URL externe ou signée détectée, tentative de téléchargement direct...");
      return await downloadFileFromUrl(filePath, fileName);
    }

    // Déterminer le bucket et le chemin en fonction du préfixe
    let bucketName = 'uploads';
    let objectPath = filePath;
    
    if (filePath.startsWith('uploads/')) {
      objectPath = filePath.substring(8); // Enlever "uploads/"
      console.log(`Chemin ajusté pour bucket 'uploads': ${objectPath}`);
    } else if (filePath.startsWith('databases/')) {
      bucketName = 'databases';
      objectPath = filePath.substring(10); // Enlever "databases/"
      console.log(`Chemin ajusté pour bucket 'databases': ${objectPath}`);
    } else if (!filePath.includes('/')) {
      // Si c'est juste un nom de fichier sans chemin, essayer dans le bucket uploads
      console.log(`Fichier simple sans chemin: ${filePath}, essai dans 'uploads'`);
    }
    
    console.log(`Téléchargement depuis le bucket '${bucketName}', chemin: '${objectPath}'`);

    // Tenter d'abord le téléchargement direct via Supabase storage
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(objectPath);
      
      if (error) {
        console.warn(`Échec du téléchargement direct: ${error.message}, tentative avec URL publique...`);
        // Si échec, on continue vers la méthode URL publique
      } else if (data) {
        console.log(`Fichier téléchargé directement avec succès. Taille: ${data.size} octets`);
        return await saveFile(data, fileName);
      }
    } catch (directError) {
      console.warn(`Erreur lors du téléchargement direct: ${directError instanceof Error ? directError.message : "Erreur inconnue"}`);
      // On continue vers la méthode URL publique
    }
      
    // Si le téléchargement direct a échoué, essayer avec l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(objectPath);
      
    if (publicUrlData?.publicUrl) {
      console.log(`URL publique générée: ${publicUrlData.publicUrl}`);
      return await downloadFileFromUrl(publicUrlData.publicUrl, fileName);
    }
    
    // Si tout échoue
    console.error(`Échec de toutes les méthodes de téléchargement pour ${filePath}`);
    toast.error("Impossible de télécharger le fichier");
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error('Erreur lors du téléchargement:', error);
    toast.error(`Erreur de téléchargement: ${errorMessage}`);
    return false;
  }
};

/**
 * Télécharge un fichier directement via une URL
 */
const downloadFileFromUrl = async (url: string, fileName: string): Promise<boolean> => {
  try {
    console.log(`Téléchargement direct via URL: ${url}`);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      toast.error(`Erreur lors du téléchargement: ${response.statusText}`);
      return false;
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      console.error("Fichier vide reçu");
      toast.error("Le fichier téléchargé est vide");
      return false;
    }
    
    return await saveFile(blob, fileName);
  } catch (error) {
    console.error('Erreur lors du téléchargement direct:', error);
    toast.error(`Erreur lors du téléchargement direct: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
};

/**
 * Sauvegarde un blob en tant que fichier téléchargeable
 */
const saveFile = async (data: Blob, fileName: string): Promise<boolean> => {
  try {
    if (data.size === 0) {
      console.error("Tentative de sauvegarde d'un fichier vide");
      toast.error("Fichier vide");
      return false;
    }
    
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
