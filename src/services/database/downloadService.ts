
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensureDatabaseBucketExists } from "./config";

export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}, nom: ${fileName}`);
    
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      return false;
    }

    // Nettoyer et standardiser le chemin du fichier
    let bucketName = 'databases'; // Le bucket par défaut
    let path = filePath;
    
    // Traiter les URLs Supabase Storage
    if (filePath.includes('/storage/v1/object/public/')) {
      try {
        const parts = filePath.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const pathParts = parts[1].split('/', 1);
          bucketName = pathParts[0];
          path = parts[1].substring(bucketName.length + 1);
        }
      } catch (error) {
        console.error("Erreur lors du parsing de l'URL:", error);
      }
    } 
    // Traiter les URLs complètes (non-Supabase)
    else if (filePath.startsWith('http')) {
      console.log("Téléchargement direct via URL:", filePath);
      
      // Pour les URLs non-Supabase, télécharger directement
      const response = await fetch(filePath);
      if (!response.ok) {
        console.error(`Erreur HTTP lors du téléchargement: ${response.status} ${response.statusText}`);
        toast.error(`Erreur lors du téléchargement: ${response.statusText}`);
        return false;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer l'élément de téléchargement
      const element = document.createElement('a');
      element.href = blobUrl;
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Libérer l'URL créée
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success(`Téléchargement de "${fileName}" réussi`);
      return true;
    }
    
    console.log(`Téléchargement depuis le bucket '${bucketName}' avec le chemin: ${path}`);
    console.log(`URL complète: ${supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl}`);
    
    // Vérifier si le fichier existe avant de le télécharger
    const { data: fileExists } = await supabase.storage
      .from(bucketName)
      .list(path.split('/').slice(0, -1).join('/') || '', {
        search: path.split('/').pop() || ''
      });
      
    if (!fileExists || fileExists.length === 0) {
      console.error(`Fichier non trouvé: ${path}`);
      toast.error("Le fichier n'a pas été trouvé");
      return false;
    }
    
    // Télécharger le fichier depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error("Erreur lors du téléchargement depuis Supabase Storage:", error);
      
      if (error.message.includes('The resource was not found')) {
        toast.error("Le fichier n'a pas été trouvé sur le serveur");
      } else {
        toast.error(`Erreur de téléchargement: ${error.message}`);
      }
      return false;
    }
    
    if (!data) {
      console.error("Aucune donnée reçue du serveur");
      toast.error("Impossible de récupérer le fichier");
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
    
    toast.success(`Téléchargement de "${fileName}" réussi`);
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement:", error);
    toast.error("Une erreur est survenue lors du téléchargement");
    return false;
  }
};
