
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DatabaseFile } from '@/types/database.types';
import { getUserById } from "@/services/userService";
import { ensureDatabaseBucketExists, ensureBucketIsPublic } from "./config";

export const uploadFile = async (file: File, bucket: string = 'databases') => {
  try {
    // Vérification de l'authentification
    const { data: session } = await supabase.auth.getSession();
    if (!session || !session.session) {
      console.error('Utilisateur non authentifié');
      toast.error('Vous devez être connecté pour télécharger des fichiers');
      return null;
    }
    console.log(`Utilisateur authentifié: ${session.session.user.id}, bucket: ${bucket}`);

    // Toast de chargement
    const loadingToast = toast.loading('Téléchargement en cours...');
    
    // Vérification du fichier
    if (!file) {
      toast.dismiss(loadingToast);
      toast.error('Aucun fichier sélectionné');
      return null;
    }
    
    // Vérification que le bucket existe et est public
    await ensureBucketIsPublic(bucket);
    
    // Nom de fichier unique
    const uniqueFileName = `${Date.now()}_${file.name}`;
    
    // Log pour déboguer
    console.log(`Téléversement du fichier: ${uniqueFileName} dans le bucket ${bucket}`);
    
    // Téléverser le fichier avec upsert à true
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    // Gérer les erreurs
    if (error) {
      console.error('Erreur de téléversement:', error);
      toast.dismiss(loadingToast);
      toast.error(`Erreur: ${error.message}`);
      return null;
    }
    
    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);
    
    // Notification de succès
    toast.dismiss(loadingToast);
    toast.success('Fichier téléchargé avec succès');
    console.log(`Téléversement réussi: ${urlData.publicUrl}`);
    
    return urlData.publicUrl;
  } catch (err) {
    // Log des exceptions
    const error = err as Error;
    console.error('Exception:', error);
    toast.error(`Exception: ${error.message}`);
    return null;
  }
};

// Fonction spécifique pour le téléversement de bases de données
export const uploadDatabaseFile = async (file: File, userId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
  try {
    const fileUrl = await uploadFile(file, 'databases');
    
    if (!fileUrl) {
      return { success: false, error: "Échec du téléversement du fichier" };
    }
    
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
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            uploaded_by: userId,
            uploader_name: uploaderName
          }
        ]);
      
      if (dbError) {
        console.error("Erreur lors de l'enregistrement:", dbError);
        return { success: false, error: dbError.message };
      }
      
      // Déclencher l'événement pour actualiser la liste
      window.dispatchEvent(new CustomEvent('database-uploaded'));
      
      return { 
        success: true, 
        fileUrl: fileUrl 
      };
    } catch (error) {
      console.error("Erreur inattendue lors de l'enregistrement:", error);
      return { success: false, error: "Erreur lors de l'enregistrement des informations" };
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
};

// Fonction pour téléverser un fichier template d'emailing
export const uploadTemplateFile = async (file: File): Promise<string | null> => {
  console.log("Téléversement du fichier template:", file.name);
  return await uploadFile(file, 'templates');
};

// Fonction pour téléverser un fichier de blacklist
export const uploadBlacklistFile = async (file: File): Promise<string | null> => {
  console.log("Téléversement du fichier blacklist:", file.name);
  return await uploadFile(file, 'blacklists');
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
