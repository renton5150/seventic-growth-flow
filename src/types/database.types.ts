
export interface DatabaseFile {
  id: string;
  name: string;
  fileName: string;  // Match the column from database_files table
  fileUrl: string;   // Match the column from database_files table
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
}
