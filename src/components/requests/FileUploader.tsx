import React, { useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "@/services/database";

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
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(e.target.files);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
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
      
      if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('uploads/') || value.includes('storage')) {
        const fileName = value.split('/').pop() || 'document';
        
        // Afficher un toast de chargement
        const loadingToast = toast.loading("Téléchargement en cours...");
        
        const success = await downloadFile(value, decodeURIComponent(fileName));
        
        // Supprimer le toast de chargement
        toast.dismiss(loadingToast);
        
        if (!success) {
          toast.error("Erreur lors du téléchargement du fichier");
        }
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setDownloading(false);
    }
  };
  
  const renderFilePreview = () => {
    if (typeof value === 'string' && value) {
      const fileName = value.split('/').pop() || value;
      
      return (
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium">{decodeURIComponent(fileName)}</span>
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
    <div
      className={`border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center justify-center cursor-pointer
        ${disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'hover:border-muted-foreground/20'}`}
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
  );
};
