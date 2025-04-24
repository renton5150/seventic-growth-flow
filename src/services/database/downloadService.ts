
import { supabase } from "@/integrations/supabase/client";

/**
 * Télécharge un fichier du bucket de stockage Supabase
 * @param filePath Le chemin du fichier dans le bucket
 * @param fileName Le nom du fichier à utiliser pour le téléchargement
 * @returns Un booléen indiquant si le téléchargement a réussi
 */
export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    // Si l'URL est fournie au lieu du chemin du fichier, extrayez le nom du fichier
    const path = filePath.includes('/')
      ? filePath.split('/').pop()
      : filePath;
      
    if (!path) {
      console.error("Chemin de fichier invalide");
      return false;
    }
    
    console.log(`Téléchargement du fichier: ${path} depuis le bucket 'databases'`);
    
    const { data, error } = await supabase.storage
      .from('databases')
      .download(path);
      
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      return false;
    }
    
    if (!data) {
      console.error('Aucune donnée reçue pour ce fichier');
      return false;
    }
    
    // Créer un URL objet pour le téléchargement
    const blobUrl = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.href = blobUrl;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée après un court délai
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return false;
  }
};
