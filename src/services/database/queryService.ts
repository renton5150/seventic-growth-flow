
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from "@/types/database.types";

/**
 * Récupérer tous les fichiers de base de données
 */
export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('database_files')
      .select(`
        id,
        name,
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_by,
        uploader_name,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }

    return data?.map(file => ({
      id: file.id,
      name: file.name,
      fileName: file.file_name,
      fileUrl: file.file_url,
      fileType: file.file_type,
      fileSize: file.file_size,
      uploadedBy: file.uploaded_by,
      uploaderName: file.uploader_name,
      createdAt: file.created_at,
    })) || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return [];
  }
};

/**
 * Alias pour compatibilité
 */
export const getAllDatabaseFiles = getAllDatabases;
