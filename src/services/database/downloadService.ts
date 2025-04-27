
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}`);
    
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      return false;
    }
    
    // Si c'est une URL complète, extraire le chemin du fichier
    let path = filePath;
    
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        // Extraction du chemin du fichier à partir de l'URL
        const pathParts = url.pathname.split('/');
        // Prendre uniquement le nom du fichier à la fin du chemin
        path = pathParts[pathParts.length - 1];
        console.log("Chemin extrait de l'URL:", path);
      } catch (error) {
        console.error("Erreur lors du parsing de l'URL:", error);
      }
    } else if (filePath.startsWith('uploads/')) {
      // Si le chemin commence par 'uploads/', considérer que c'est déjà le chemin relatif
      path = filePath;
      console.log("Utilisation du chemin relatif:", path);
    }
    
    // Si le path contient encore des segments de chemin ou des dossiers, les retirer
    if (path.includes('/')) {
      path = path.split('/').pop() || '';
    }
    
    console.log(`Téléchargement du fichier depuis le bucket 'databases' avec le chemin: ${path}`);
    
    // Télécharger le fichier depuis le bucket "databases"
    const { data, error } = await supabase.storage
      .from('databases')
      .download(path);
    
    if (error) {
      console.error("Erreur lors du téléchargement:", error);
      
      // Si l'erreur est liée à l'authentification, informer l'utilisateur
      if (error.message.includes('JWT')) {
        toast.error("Vous devez être connecté pour télécharger des fichiers");
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
      return false;
    }
    
    if (!data) {
      console.error("Aucune donnée reçue");
      return false;
    }
    
    // Créer un URL objet pour le téléchargement
    const blobUrl = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.href = blobUrl;
    element.download = fileName;
    
    // Déclencher le téléchargement
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement:", error);
    return false;
  }
};
