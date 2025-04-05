
export interface DatabaseFile {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
}
