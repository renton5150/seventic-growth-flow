
import React from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    
    if (!value || disabled || typeof value !== 'string') return;
    
    try {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        const path = value.split('/').pop() || '';
        
        const { data, error } = await supabase.storage
          .from('databases')
          .download(path);
          
        if (error) {
          console.error('Erreur lors du téléchargement:', error);
          return;
        }
        
        const blobUrl = URL.createObjectURL(data);
        const element = document.createElement('a');
        element.href = blobUrl;
        element.download = value.split('/').pop() || 'document';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
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
            className="mt-2 text-sm text-blue-600 hover:underline focus:outline-none"
          >
            Télécharger
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
