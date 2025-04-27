
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensureDatabaseBucketExists } from "./config";
import { extractPathFromSupabaseUrl } from "./utils";

export const downloadFile = async (filePath: string, fileName: string = "document"): Promise<boolean> => {
  try {
    console.log(`Tentative de téléchargement: ${filePath}, nom: ${fileName}`);
    
    if (!filePath) {
      console.error("Chemin de fichier vide ou non défini");
      return false;
    }

    // Pour les URLs externes (non-Supabase)
    if (filePath.startsWith('http') && !filePath.includes('/storage/v1/object/public/')) {
      console.log("Téléchargement direct via URL externe:", filePath);
      
      try {
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
        
        return true;
      } catch (error) {
        console.error("Erreur lors du téléchargement depuis URL externe:", error);
        return false;
      }
    }
    
    // Pour les chemins Supabase Storage ou les chemins relatifs
    const pathInfo = extractPathFromSupabaseUrl(filePath);
    
    // Si l'extraction a échoué et que ce n'est pas un chemin relatif
    if (!pathInfo && filePath.includes('http')) {
      console.error("Format d'URL non reconnu:", filePath);
      toast.error("Format d'URL non reconnu");
      return false;
    }
    
    // Si c'est un chemin relatif sans URL complète (ex: uploads/...)
    const bucketName = pathInfo?.bucketName || 'databases';
    const path = pathInfo?.filePath || filePath;
    
    console.log(`Préparation du téléchargement depuis le bucket '${bucketName}' avec le chemin: ${path}`);
    
    // S'assurer que le bucket existe
    if (bucketName === 'databases') {
      await ensureDatabaseBucketExists();
    }
    
    // Télécharger le fichier depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error("Erreur lors du téléchargement depuis Supabase Storage:", error);
      
      if (error.message.includes('The resource was not found')) {
        // Essayer de télécharger via l'URL publique comme solution de secours
        console.log("Fichier non trouvé via download. Tentative via URL publique...");
        
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(path);
          
        if (urlData && urlData.publicUrl) {
          console.log("URL publique obtenue:", urlData.publicUrl);
          
          try {
            const response = await fetch(urlData.publicUrl);
            if (!response.ok) {
              toast.error("Le fichier n'a pas été trouvé sur le serveur");
              return false;
            }
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const element = document.createElement('a');
            element.href = blobUrl;
            element.download = fileName;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 100);
            
            return true;
          } catch (fetchError) {
            console.error("Erreur lors de la tentative alternative:", fetchError);
            toast.error("Erreur lors du téléchargement");
            return false;
          }
        } else {
          toast.error("Le fichier n'a pas été trouvé sur le serveur");
          return false;
        }
      } else {
        toast.error(`Erreur de téléchargement: ${error.message}`);
        return false;
      }
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
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement:", error);
    toast.error("Une erreur est survenue lors du téléchargement");
    return false;
  }
};
