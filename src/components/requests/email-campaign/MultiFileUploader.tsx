
import { useState } from "react";
import { Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/requests/FileUploader";
import { toast } from "sonner";

interface MultiFileUploaderProps {
  files: string[];
  onChange: (files: string[]) => void;
  handleFileUpload: (field: string, files: FileList | null | string) => Promise<void>;
  disabled?: boolean;
}

export const MultiFileUploader = ({ 
  files, 
  onChange, 
  handleFileUpload, 
  disabled = false 
}: MultiFileUploaderProps) => {
  const [uploading, setUploading] = useState<number | null>(null);

  const handleAddFile = async (fileList: FileList | null | string, index: number) => {
    if (!fileList || typeof fileList === 'string' || fileList.length === 0) {
      return;
    }

    setUploading(index);
    
    try {
      // Créer un champ temporaire pour le file uploader
      const tempFieldName = `databaseFile_${index}`;
      
      // Utiliser la fonction handleFileUpload existante
      await handleFileUpload(tempFieldName, fileList);
      
      // Le file uploader va gérer l'upload et nous devons récupérer l'URL
      // Pour cela, on va écouter les changements sur le formulaire
      // Cette approche n'est pas idéale, mais maintient la compatibilité
      
      toast.success("Fichier téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const addNewFileSlot = () => {
    // On ne fait rien ici, le FileUploader va gérer l'ajout
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
      {files.map((fileUrl, index) => (
        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
          <div className="flex-1">
            <span className="text-sm font-medium">{getFileName(fileUrl)}</span>
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
          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
          title={uploading !== null ? "Téléchargement en cours..." : "Ajouter une base de données"}
          description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
          value=""
          onChange={(fileList) => {
            if (fileList && typeof fileList !== 'string' && fileList.length > 0) {
              handleAddFile(fileList, files.length);
            }
          }}
          accept=".xls,.xlsx,.csv"
          maxSize={50}
          disabled={disabled || uploading !== null}
        />
      </div>
    </div>
  );
};
