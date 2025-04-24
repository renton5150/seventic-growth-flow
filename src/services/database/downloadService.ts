
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
    // Gestion des URLs complètes vs chemins relatifs
    let path = filePath;
    
    // Si c'est une URL complète, extraire le chemin du fichier
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      // Le dernier segment de l'URL après /object/public/databases/
      const segments = url.pathname.split('/');
      const databasesIndex = segments.findIndex(s => s === 'databases');
      
      if (databasesIndex !== -1 && databasesIndex < segments.length - 1) {
        path = segments.slice(databasesIndex + 1).join('/');
      } else {
        console.error("Format d'URL Supabase non reconnu");
        toast.error("Format d'URL incorrect");
        return false;
      }
    }
    
    console.log(`Téléchargement du fichier: ${path} depuis le bucket 'databases'`);
    
    // Télécharger directement depuis le bucket de stockage
    const { data, error } = await supabase.storage
      .from('databases')
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
