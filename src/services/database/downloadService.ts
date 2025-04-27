
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

    // Si le chemin commence avec "uploads/", récupérer le nom du fichier
    let bucketName = 'uploads';
    let objectPath = filePath;
    
    if (filePath.startsWith('uploads/')) {
      objectPath = filePath.substring(8); // Enlever "uploads/"
    } else if (filePath.startsWith('databases/')) {
      bucketName = 'databases';
      objectPath = filePath.substring(10); // Enlever "databases/"
    }
    
    console.log(`Téléchargement depuis le bucket '${bucketName}', chemin: '${objectPath}'`);

    // Récupérer l'URL publique du fichier
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(objectPath);
      
    if (publicUrlData?.publicUrl) {
      console.log(`URL publique générée: ${publicUrlData.publicUrl}`);
      return await downloadFileFromUrl(publicUrlData.publicUrl, fileName);
    }
    
    // Si nous n'avons pas pu obtenir l'URL publique, essayer le téléchargement direct
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(objectPath);
      
    if (error) {
      console.error('Erreur lors du téléchargement direct:', error);
      toast.error(`Erreur: ${error.message}`);
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
 * Télécharge un fichier directement via une URL
 */
const downloadFileFromUrl = async (url: string, fileName: string): Promise<boolean> => {
  try {
    console.log(`Téléchargement direct via URL: ${url}`);
    
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
