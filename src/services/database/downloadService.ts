
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}`);
    
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      toast.error("Chemin de fichier invalide");
      return false;
    }
    
    // Extraire le nom du fichier et le chemin du bucket
    let path = filePath;
    
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        // Extraire le chemin complet à partir de l'URL
        path = url.pathname;
        
        // Enlever le préfixe '/storage/v1/object/public/databases/'
        const storagePrefix = '/storage/v1/object/public/databases/';
        if (path.includes(storagePrefix)) {
          path = path.substring(path.indexOf(storagePrefix) + storagePrefix.length);
        }
        
        console.log("Chemin extrait de l'URL:", path);
      } catch (error) {
        console.error("Erreur lors du parsing de l'URL:", error);
      }
    } else if (filePath.startsWith('uploads/')) {
      // Si le chemin commence par 'uploads/', considérer que c'est déjà le chemin relatif
      path = filePath;
      console.log("Utilisation du chemin relatif:", path);
    }
    
    // Si le chemin contient encore des segments de chemin ou des dossiers, on les garde
    // Cela permet de télécharger des fichiers dans des sous-dossiers du bucket
    
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
      toast.error("Aucune donnée n'a pu être récupérée");
      return false;
    }
    
    // Utiliser le nom de fichier fourni ou extraire du chemin
    let finalFileName = fileName;
    if (finalFileName === "document") {
      finalFileName = path.split('/').pop() || "document";
    }
    
    // Créer un URL objet pour le téléchargement
    const blobUrl = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.href = blobUrl;
    element.download = decodeURIComponent(finalFileName);
    
    // Déclencher le téléchargement
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    toast.success(`Téléchargement de "${decodeURIComponent(finalFileName)}" réussi`);
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement:", error);
    toast.error("Erreur lors du téléchargement du fichier");
    return false;
  }
};
