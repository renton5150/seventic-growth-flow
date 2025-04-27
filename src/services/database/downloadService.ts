
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
    
    // Traiter les URL complètes
    if (filePath.includes('/storage/v1/object/public/')) {
      try {
        const parts = filePath.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const pathParts = parts[1].split('/', 1);
          bucketName = pathParts[0];
          path = parts[1].substring(bucketName.length + 1);
          console.log(`URL Supabase détectée - Bucket: ${bucketName}, Chemin: ${path}`);
        }
      } catch (error) {
        console.error("Erreur lors du parsing de l'URL:", error);
      }
    } 
    // Si c'est simplement un chemin sans URL complète
    else if (filePath.includes('uploads/') || !filePath.includes('http')) {
      path = filePath;
      console.log(`Chemin relatif détecté: ${path}`);
    }
    // Pour les URLs externes
    else if (filePath.startsWith('http')) {
      console.log("Téléchargement direct via URL externe:", filePath);
      
      try {
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
      } catch (error) {
        console.error("Erreur lors du téléchargement depuis URL externe:", error);
        return false;
      }
    }
    
    console.log(`Préparation du téléchargement depuis le bucket '${bucketName}' avec le chemin: ${path}`);
    
    // Si le chemin est vide après traitement, c'est une erreur
    if (!path) {
      console.error("Chemin de fichier invalide après traitement");
      return false;
    }
    
    // Vérifier si le bucket existe et est accessible
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(bucketName);
      if (bucketError) {
        console.error(`Erreur lors de la vérification du bucket ${bucketName}:`, bucketError);
        if (bucketError.message.includes('The resource was not found')) {
          toast.error(`Le bucket ${bucketName} n'existe pas`);
        }
        return false;
      }
      
      console.log(`Bucket '${bucketName}' trouvé et accessible:`, bucketInfo);
      
      // Si le bucket n'est pas public, tenter de le rendre public
      if (bucketInfo && !bucketInfo.public) {
        console.log(`Le bucket ${bucketName} n'est pas public, tentative de le rendre public...`);
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });
        
        if (updateError) {
          console.error(`Impossible de rendre le bucket ${bucketName} public:`, updateError);
        } else {
          console.log(`Bucket ${bucketName} rendu public avec succès`);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du bucket ${bucketName}:`, error);
    }
    
    // Télécharger le fichier depuis Supabase Storage
    console.log(`Tentative de téléchargement depuis ${bucketName}/${path}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      console.error("Erreur lors du téléchargement depuis Supabase Storage:", error);
      
      // Essayer une méthode alternative en cas d'échec
      if (error.message.includes('The resource was not found')) {
        console.log("Fichier non trouvé. Tentative avec URL publique...");
        
        // Essayer de télécharger via l'URL publique
        try {
          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(path);
            
          if (urlData && urlData.publicUrl) {
            console.log("URL publique obtenue:", urlData.publicUrl);
            
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
          }
        } catch (fetchError) {
          console.error("Erreur lors de la tentative alternative:", fetchError);
        }
      }
      
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
