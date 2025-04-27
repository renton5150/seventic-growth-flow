
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
    console.log(`Début du téléversement pour ${file.name}`);
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Erreur d'authentification:", sessionError);
      toast.error("Vous devez être connecté pour téléverser un fichier");
      return { success: false, error: "Non authentifié" };
    }
    
    // S'assurer que le bucket existe et est public
    const bucketExists = await ensureDatabaseBucketExists();
    if (!bucketExists) {
      toast.error("Erreur de configuration du stockage");
      return { success: false, error: "Erreur de configuration du stockage" };
    }
    
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `uploads/${timestamp}_${safeName}`;
    
    console.log("Téléversement vers:", filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('databases')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Erreur lors du téléversement:", uploadError);
      console.error("Message d'erreur:", uploadError.message);
      toast.error("Erreur lors du téléversement du fichier");
      return { success: false, error: uploadError.message };
    }
    
    if (!uploadData) {
      toast.error("Erreur lors du téléversement");
      return { success: false, error: "Aucune donnée renvoyée" };
    }
    
    const { data: publicUrlData } = await supabase.storage
      .from('databases')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      toast.error("Impossible d'obtenir l'URL du fichier");
      return { success: false, error: "URL invalide" };
    }
    
    // Obtenir les informations de l'utilisateur
    const user = await getUserById(userId);
    const uploaderName = user?.name || 'Utilisateur';
    
    // Enregistrer les informations du fichier
    try {
      const { error: dbError } = await supabase
        .from('database_files')
        .insert([
          { 
            name: file.name,
            file_name: safeName,
            file_url: publicUrlData.publicUrl,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            uploaded_by: userId,
            uploader_name: uploaderName
          }
        ]);
      
      if (dbError) {
        console.error("Erreur lors de l'enregistrement:", dbError);
        toast.error("Erreur lors de l'enregistrement des informations");
      }
    } catch (error) {
      console.error("Erreur inattendue lors de l'enregistrement:", error);
    }
    
    toast.success("Fichier téléversé avec succès");
    return { 
      success: true, 
      fileUrl: publicUrlData.publicUrl 
    };
  } catch (error) {
    console.error("Erreur inattendue:", error);
    toast.error("Une erreur inattendue s'est produite");
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
};
