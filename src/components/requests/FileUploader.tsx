import React, { useState } from "react";
import { toast } from "sonner";
import { downloadDatabaseFile, extractFileName } from "@/services/database";
import { AlertCircle } from "lucide-react";

interface FileUploaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string | null | undefined;
  onChange: (files: FileList | null | string) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export const FileUploader = ({ 
  icon,
  title,
  description,
  value,
  onChange,
  accept,
  maxSize,
  disabled
}: FileUploaderProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        setError(`Le fichier est trop volumineux (max ${maxSize}MB)`);
        toast.error(`Le fichier est trop volumineux (max ${maxSize}MB)`);
        return;
      }
      
      console.log(`Fichier sélectionné: ${file.name}, taille: ${file.size}, type: ${file.type}`);
    }
    
    onChange(e.target.files);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        setError(`Le fichier est trop volumineux (max ${maxSize}MB)`);
        toast.error(`Le fichier est trop volumineux (max ${maxSize}MB)`);
        return;
      }
      
      console.log(`Fichier déposé: ${file.name}, taille: ${file.size}, type: ${file.type}`);
      onChange(e.dataTransfer.files);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!value || disabled || typeof value !== 'string' || downloading) return;
    
    try {
      setDownloading(true);
      setError(null);
      
      const loadingToast = toast.loading("Téléchargement en cours...");
      
      const fileName = extractFileName(value);
      console.log(`Téléchargement demandé pour: ${value}, nom extrait: ${fileName}`);
      
      const success = await downloadDatabaseFile(value, fileName);
      
      toast.dismiss(loadingToast);
      
      if (!success) {
        setError("Erreur lors du téléchargement du fichier");
        toast.error("Erreur lors du téléchargement du fichier");
      } else {
        toast.success(`Fichier "${fileName}" téléchargé avec succès`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError("Erreur lors du téléchargement du fichier");
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setDownloading(false);
    }
  };
  
  const renderFilePreview = () => {
    if (typeof value === 'string' && value) {
      const fileName = extractFileName(value);
      
      return (
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium break-all max-w-full">{fileName}</span>
          </div>
          <button 
            onClick={handleDownload}
            className="mt-2 text-sm text-blue-600 hover:underline focus:outline-none disabled:opacity-50"
            disabled={downloading || disabled}
          >
            {downloading ? 'Téléchargement...' : 'Télécharger'}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="mt-1 text-xs text-red-500 hover:underline focus:outline-none"
            disabled={disabled}
          >
            Supprimer
          </button>
        </div>
      );
    }
    
    return (
      <>
        {icon}
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </>
    );
  };
  
  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center justify-center cursor-pointer
          ${disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'hover:border-muted-foreground/20'}
          ${error ? 'border-red-300 bg-red-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        {renderFilePreview()}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={accept}
          disabled={disabled}
        />
      </div>
      
      {error && (
        <div className="flex items-center text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};
