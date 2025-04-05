
import { useState, DragEvent, ChangeEvent, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  value?: string;
  onChange: (files: FileList | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const FileUploader = ({
  icon,
  title,
  description,
  value,
  onChange,
  accept,
  maxSize = 10,
  disabled = false,
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Update fileName when value changes
  useEffect(() => {
    if (value) {
      const nameFromPath = typeof value === 'string' ? value.split('/').pop() : null;
      if (nameFromPath) setFileName(nameFromPath);
    } else {
      setFileName(null);
    }
  }, [value]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    if (disabled) return;
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const validateAndProcessFiles = (files: FileList) => {
    const file = files[0];
    
    // Validation de taille
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      toast.error(`Le fichier est trop volumineux. Limite: ${maxSize}MB`);
      return;
    }
    
    setFileName(file.name);
    onChange(files);
  };

  const clearFile = () => {
    setFileName(null);
    onChange(null);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-md p-6 transition-colors",
        isDragging ? "border-seventic-500 bg-seventic-50" : "border-input",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (!disabled) {
          document.getElementById("file-input")?.click();
        }
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <div className="p-3 rounded-full bg-muted">
          {icon}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {fileName ? (
          <div className="flex items-center justify-between w-full bg-accent/50 p-2 rounded mt-2">
            <span className="text-sm truncate max-w-[200px]">{fileName}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                if (!disabled) {
                  e.stopPropagation();
                  clearFile();
                }
              }}
              disabled={disabled}
            >
              X
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-2">
            {disabled ? "Téléchargement en cours..." : "Glissez-déposez ou cliquez pour sélectionner"}
          </div>
        )}
        
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
