
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from '@/types/database.types';

export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('database_files')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des bases de données:", error);
      throw error;
    }
    
    // Transformer les données pour correspondre à l'interface DatabaseFile
    const transformedData: DatabaseFile[] = data?.map(item => ({
      id: item.id,
      name: item.name,
      fileName: item.file_name,
      fileUrl: item.file_url,
      fileType: item.file_type,
      fileSize: item.file_size,
      uploadedBy: item.uploaded_by || '',
      uploaderName: item.uploader_name || '',
      createdAt: item.created_at
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error("Erreur lors de la récupération des bases de données:", error);
    return [];
  }
};
