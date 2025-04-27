
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DatabaseFile } from '@/types/database.types';
import { getUserById } from "@/services/userService";
import { ensureDatabaseBucketExists, ensureBucketIsPublic } from "./config";

export type UploadResult = {
  success: boolean;
  fileUrl?: string;
  error?: string;
};

export const uploadDatabaseFile = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    console.log(`Début du téléversement: ${file.name} par utilisateur ${userId}`);
    
    // Vérifier que l'utilisateur est bien authentifié
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Erreur d'authentification:", sessionError);
      toast.error("Vous devez être connecté pour téléverser un fichier");
      return { success: false, error: "Non authentifié" };
    }
    
    // S'assurer que le bucket existe et est public
    const bucketExists = await ensureDatabaseBucketExists();
    if (!bucketExists) {
      console.error("Impossible de créer ou vérifier le bucket 'databases'");
      toast.error("Erreur de configuration du stockage");
      return { success: false, error: "Erreur de configuration du stockage" };
    }
    
    // S'assurer que le bucket est public
    await ensureBucketIsPublic('databases');
    
    const fileName = file.name.replace(/\s+/g, '_'); // Remplacer les espaces par des tirets bas
    const fileExt = fileName.split('.').pop();
    const timestamp = Date.now();
    const filePath = `uploads/${timestamp}_${fileName}`;
    
    console.log(`Téléchargement du fichier ${fileName} (${fileExt}) vers le chemin ${filePath}`);
    console.log("Session utilisateur:", session.user.id);
    
    // Téléverser le fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('databases')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Erreur lors du téléversement:", uploadError);
      console.log("Code d'erreur:", uploadError.code);
      console.log("Message d'erreur:", uploadError.message);
      console.log("Détails:", uploadError.details);
      
      // Messages d'erreur plus spécifiques
      if (uploadError.message.includes('JWT')) {
        toast.error("Problème d'authentification avec le serveur de stockage");
      } else if (uploadError.message.includes('size')) {
        toast.error("Fichier trop volumineux");
      } else if (uploadError.message.includes('not found')) {
        toast.error("Le service de stockage n'est pas disponible");
      } else if (uploadError.message.includes('permission')) {
        toast.error("Vous n'avez pas les permissions nécessaires");
      } else {
        toast.error(`Erreur: ${uploadError.message}`);
      }
      
      return { 
        success: false, 
        error: uploadError.message 
      };
    }
    
    if (!uploadData) {
      console.error("Aucune donnée renvoyée par le service de stockage");
      return { 
        success: false, 
        error: "Aucune donnée renvoyée par le service de stockage" 
      };
    }
    
    console.log("Téléversement réussi:", uploadData);
    
    // Créer un URL public pour le fichier téléversé
    const { data: publicUrlData } = await supabase.storage
      .from('databases')
      .getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Impossible d'obtenir l'URL publique");
      
      // Tentative de réparer le bucket et réessayer
      await ensureBucketIsPublic('databases');
      
      // Réessayer d'obtenir l'URL publique
      const { data: retryUrlData } = await supabase.storage
        .from('databases')
        .getPublicUrl(filePath);
        
      if (!retryUrlData || !retryUrlData.publicUrl) {
        toast.error("Impossible d'obtenir l'URL du fichier");
        return { 
          success: false, 
          error: "Impossible d'obtenir l'URL publique" 
        };
      }
      
      console.log("URL publique obtenue après correction du bucket:", retryUrlData.publicUrl);
      
      // Obtenir les informations de l'utilisateur
      const user = await getUserById(userId);
      const uploaderName = user?.name || 'Utilisateur';
      
      // Enregistrer les informations du fichier dans la base de données
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('database_files')
          .insert([
            { 
              name: fileName,
              file_name: fileName,
              file_url: retryUrlData.publicUrl,
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
        } else {
          console.log("Fichier enregistré avec succès dans la base de données:", dbData);
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du fichier:", error);
      }
      
      return { 
        success: true, 
        fileUrl: retryUrlData.publicUrl 
      };
    }
    
    console.log("URL publique du fichier:", publicUrlData.publicUrl);
    
    // Obtenir les informations de l'utilisateur
    const user = await getUserById(userId);
    const uploaderName = user?.name || 'Utilisateur';
    
    // Enregistrer les informations du fichier dans la base de données
    try {
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
      } else {
        console.log("Fichier enregistré avec succès dans la base de données:", dbData);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du fichier:", error);
    }
    
    return { 
      success: true, 
      fileUrl: publicUrlData.publicUrl 
    };
  } catch (error) {
    console.error("Erreur lors du téléversement:", error);
    toast.error("Une erreur inattendue s'est produite");
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
};
