
import React from "react";
import { Upload } from "lucide-react";

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

  // Fonction pour télécharger un fichier existant
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!value || disabled || typeof value !== 'string') return;
    
    // Pour les URLs complètes (http/https)
    if (value.startsWith('http://') || value.startsWith('https://')) {
      window.open(value, '_blank');
      return;
    }
    
    // Pour les chemins locaux (mode démo)
    // Au lieu de créer un blob avec du contenu fictif, créons un lien vers un fichier Excel vide valide
    const element = document.createElement('a');
    
    // Déterminer le type de fichier à partir de l'extension
    const fileExtension = value.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/octet-stream';
    
    if (fileExtension === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileExtension === 'xls') {
      mimeType = 'application/vnd.ms-excel';
    } else if (fileExtension === 'csv') {
      mimeType = 'text/csv';
    }
    
    // Créer un nouveau blob avec l'en-tête correct pour chaque type de fichier
    let fileContent;
    
    if (fileExtension === 'csv') {
      // En-tête CSV minimal valide
      fileContent = 'Column1,Column2,Column3\nValue1,Value2,Value3';
    } else {
      // Pour les fichiers Excel, utilisons un arraybuffer avec un en-tête minimal
      // Ceci est une approximation - idéalement, nous utiliserions une bibliothèque comme ExcelJS
      // mais pour une démo cela montrerait au moins le concept
      fileContent = new Uint8Array([
        0x50, 0x4B, 0x03, 0x04, // Signature pour les fichiers XLSX (ZIP)
        0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    element.href = URL.createObjectURL(blob);
    
    const filename = value.split('/').pop() || "document";
    element.download = decodeURIComponent(filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée
    setTimeout(() => {
      URL.revokeObjectURL(element.href);
    }, 100);
  };
  
  const renderFilePreview = () => {
    // Si valeur est une chaîne (URL ou chemin de fichier)
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
