
import { DatabaseFile } from "@/types/database.types";

// Map de données Supabase (snake_case) vers l'interface DatabaseFile (camelCase)
export const mapToDatabaseFile = (data: any): DatabaseFile => {
  return {
    id: data.id,
    name: data.name,
    fileName: data.file_name,
    fileUrl: data.file_url,
    fileType: data.file_type,
    fileSize: data.file_size,
    uploadedBy: data.uploaded_by,
    uploaderName: data.uploader_name,
    createdAt: data.created_at
  };
};
