
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}`);
    
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      return false;
    }

    // Traiter le chemin du fichier selon son format
    let path = filePath;
    let bucketName = 'databases'; // Le bucket par défaut
    
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        
        // Si l'URL est une URL Supabase Storage
        if (url.pathname.includes('/storage/v1/object/public/')) {
          const parts = url.pathname.split('/storage/v1/object/public/');
          if (parts.length > 1) {
            // Extraire le nom du bucket et le chemin
            const pathParts = parts[1].split('/', 1);
            bucketName = pathParts[0];
            path = parts[1].substring(bucketName.length + 1); // +1 pour le slash
          }
        }
        
        console.log(`URL analysée: bucket=${bucketName}, path=${path}`);
      } catch (error) {
        console.error("Erreur lors du parsing de l'URL:", error);
      }
    } else if (filePath.includes('/')) {
      // Si c'est un chemin relatif, essayer d'extraire le bucket et le chemin
      const pathParts = filePath.split('/', 1);
      if (pathParts.length > 0 && pathParts[0]) {
        bucketName = pathParts[0];
        path = filePath.substring(bucketName.length + 1); // +1 pour le slash
      }
    }
    
    console.log(`Téléchargement depuis le bucket '${bucketName}' avec le chemin: ${path}`);
    
    // Télécharger le fichier depuis le bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error("Erreur lors du téléchargement:", error);
      
      // Afficher des messages d'erreur plus spécifiques
      if (error.message.includes('JWT')) {
        toast.error("Vous devez être connecté pour télécharger des fichiers");
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        toast.error("Le fichier n'a pas été trouvé");
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
