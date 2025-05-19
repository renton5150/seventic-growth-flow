
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from '@/types/database.types';

export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('database_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching databases:", error);
      return [];
    }

    // Transform the Supabase data to match DatabaseFile interface
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
    console.error("Unexpected error in getAllDatabases:", error);
    return [];
  }
};

// Alias for consistent naming
export const getAllDatabaseFiles = getAllDatabases;
