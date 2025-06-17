
import { useState } from "react";
import { Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/requests/FileUploader";
import { toast } from "sonner";

interface MultiFileUploaderProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  value?: string[]; // Changé de files à value pour correspondre à FormField
  onChange: (files: string[]) => void; // Changé pour correspondre à FormField
  handleFileUpload?: (field: string, files: FileList | null | string) => Promise<void>;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
}

export const MultiFileUploader = ({ 
  icon = <Upload className="h-6 w-6 text-muted-foreground" />,
  title = "Ajouter des fichiers",
  description = "Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)",
  value = [], // Valeur par défaut est un tableau vide
  onChange, 
  handleFileUpload,
  disabled = false,
  accept = ".xls,.xlsx,.csv",
  maxSize = 50
}: MultiFileUploaderProps) => {
  const [uploading, setUploading] = useState<number | null>(null);

  const handleAddFile = async (fileList: FileList | null | string, index: number) => {
    if (!fileList || typeof fileList === 'string' || fileList.length === 0) {
      return;
    }

    setUploading(index);
    
    try {
      // Simuler l'upload pour l'instant - dans un vrai cas, 
      // on utiliserait handleFileUpload si fourni
      const file = fileList[0];
      
      // Créer une URL temporaire pour la démo
      const tempUrl = `temp_${Date.now()}_${file.name}`;
      
      const newFiles = [...value, tempUrl];
      onChange(newFiles);
      
      toast.success("Fichier ajouté avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileName = (url: string): string => {
    if (!url) return "";
    
    try {
      const segments = url.split('/');
      const fileName = segments[segments.length - 1];
      const decodedFileName = decodeURIComponent(fileName);
      
      if (/^\d+_/.test(decodedFileName)) {
        const namePart = decodedFileName.split('_').slice(1).join('_');
        if (namePart) {
          return namePart;
        }
      }
      
      return decodedFileName;
    } catch (e) {
      return "fichier";
    }
  };

  return (
    <div className="space-y-4">
      {/* Fichiers existants */}
      {value && value.length > 0 && value.map((fileUrl, index) => (
        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
          <div className="flex-1">
            <span className="text-sm font-medium break-all max-w-full">{getFileName(fileUrl)}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRemoveFile(index)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Uploader pour nouveau fichier */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <FileUploader
          icon={icon}
          title={uploading !== null ? "Téléchargement en cours..." : title}
          description={description}
          value=""
          onChange={(fileList) => {
            if (fileList && typeof fileList !== 'string' && fileList.length > 0) {
              handleAddFile(fileList, value.length);
            }
          }}
          accept={accept}
          maxSize={maxSize}
          disabled={disabled || uploading !== null}
        />
      </div>
    </div>
  );
};
