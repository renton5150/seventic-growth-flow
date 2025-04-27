
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
    
    console.log("URL publique obtenue:", publicUrlData.publicUrl);
    
    // Obtenir les informations de l'utilisateur
    const user = await getUserById(userId);
    const uploaderName = user?.name || 'Utilisateur';
    
    // Enregistrer les informations du fichier dans la table database_files
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
        console.error("Message d'erreur:", dbError.message);
        toast.error("Erreur lors de l'enregistrement des informations");
        // On continue malgré l'erreur car le fichier a bien été téléversé
      } else {
        console.log("Informations du fichier enregistrées avec succès dans la table database_files");
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

export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    console.log("Récupération de toutes les bases de données");
    
    const { data, error } = await supabase
      .from('database_files')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des bases de données:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("Aucune base de données trouvée");
      return [];
    }
    
    console.log(`${data.length} bases de données récupérées`);
    
    return data.map(file => ({
      id: file.id,
      name: file.name,
      fileName: file.file_name,
      fileUrl: file.file_url,
      fileType: file.file_type,
      fileSize: file.file_size,
      uploadedBy: file.uploaded_by,
      uploaderName: file.uploader_name,
      createdAt: file.created_at
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des bases de données:", error);
    return [];
  }
};
