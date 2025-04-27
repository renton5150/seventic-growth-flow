
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DatabaseFile } from '@/types/database.types';
import { getUserById } from "@/services/userService";
import { ensureDatabaseBucketExists } from "./config";

export type UploadResult = {
  success: boolean;
  fileUrl?: string;
  error?: string;
};

export const uploadDatabaseFile = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    // S'assurer que le bucket 'databases' existe
    const bucketExists = await ensureDatabaseBucketExists();
    if (!bucketExists) {
      return { 
        success: false, 
        error: "Impossible de créer ou d'accéder au bucket de stockage" 
      };
    }
    
    const fileName = file.name.replace(/\s+/g, '_'); // Remplacer les espaces par des tirets bas
    const fileExt = fileName.split('.').pop();
    const filePath = `${Date.now()}_${fileName}`;
    
    console.log(`Téléchargement du fichier ${fileName} (${fileExt}) vers le chemin ${filePath}`);
    
    // Téléverser le fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('databases')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error("Erreur lors du téléversement:", uploadError);
      return { 
        success: false, 
        error: uploadError.message 
      };
    }
    
    if (!uploadData) {
      return { 
        success: false, 
        error: "Aucune donnée renvoyée par le service de stockage" 
      };
    }
    
    // Créer un URL public pour le fichier téléversé
    const { data: publicUrlData } = await supabase.storage
      .from('databases')
      .getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Impossible d'obtenir l'URL publique");
      return { 
        success: false, 
        error: "Impossible d'obtenir l'URL publique" 
      };
    }
    
    // Obtenir les informations de l'utilisateur
    const user = await getUserById(userId);
    const uploaderName = user?.name || 'Utilisateur';
    
    // Enregistrer les informations du fichier dans la base de données
    const { data: dbData, error: dbError } = await supabase
      .from('database_files')
      .insert([
        { 
          name: fileName,
          file_name: fileName,
          file_url: publicUrlData.publicUrl,
          file_type: fileExt || 'unknown',
          file_size: file.size,
          uploaded_by: userId,
          uploader_name: uploaderName
        }
      ])
      .select('*')
      .single();
    
    if (dbError) {
      console.error("Erreur lors de l'enregistrement dans la base de données:", dbError);
      return { 
        success: true, 
        fileUrl: publicUrlData.publicUrl,
        error: "Le fichier a été téléversé mais son enregistrement a échoué" 
      };
    }
    
    console.log("Fichier téléversé et enregistré avec succès:", dbData);
    return { 
      success: true, 
      fileUrl: publicUrlData.publicUrl 
    };
  } catch (error) {
    console.error("Erreur lors du téléversement:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
};
