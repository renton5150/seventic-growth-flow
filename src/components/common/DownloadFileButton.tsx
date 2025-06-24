
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useFileDownload } from '@/hooks/useFileDownload';

interface DownloadFileButtonProps {
  fileUrl: string | undefined;
  fileName?: string;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const DownloadFileButton = ({
  fileUrl,
  fileName = "document",
  label = "Télécharger le fichier",
  variant = "outline",
  size = "sm",
  className = "",
}: DownloadFileButtonProps) => {
  const { downloading, handleFileDownload } = useFileDownload();
  const [isDownloadable, setIsDownloadable] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const isDownloading = downloading === fileUrl;
  
  // Fonction pour extraire le nom réel du fichier - SANS MODIFICATION
  const getCleanFileName = (url: string, fallbackName: string): string => {
    if (!url) return fallbackName;
    
    try {
      // Extraire le nom depuis l'URL
      const segments = url.split('/');
      let name = segments[segments.length - 1];
      
      // Supprimer les paramètres d'URL s'il y en a
      if (name.includes('?')) {
        name = name.split('?')[0];
      }
      
      // Décoder l'URL et retourner le nom tel quel
      return decodeURIComponent(name) || fallbackName;
    } catch (e) {
      console.error("Erreur lors de l'extraction du nom de fichier:", e);
      return fallbackName;
    }
  };

  const displayFileName = getCleanFileName(fileUrl || '', fileName);
  
  useEffect(() => {
    const checkFileDownloadable = () => {
      if (!fileUrl) {
        console.log('Pas d\'URL de fichier fournie');
        setIsDownloadable(false);
        setHasError(true);
        return;
      }
      
      console.log(`URL de fichier valide: ${fileUrl}`);
      setIsDownloadable(true);
      setHasError(false);
    };
    
    checkFileDownloadable();
  }, [fileUrl]);

  const handleClick = async () => {
    if (!fileUrl || !isDownloadable) return;
    
    console.log(`Clic sur téléchargement pour: ${fileUrl}`);
    setHasError(false);
    
    const success = await handleFileDownload(fileUrl, displayFileName);
    
    if (!success) {
      setHasError(true);
      console.error(`Échec du téléchargement pour: ${fileUrl}`);
    }
  };

  if (!fileUrl) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Fichier non disponible</span>
      </div>
    );
  }

  const isButtonDisabled = isDownloading || !isDownloadable;
  const buttonTitle = isButtonDisabled 
    ? (isDownloading ? "Téléchargement en cours" : "Fichier non disponible") 
    : `Télécharger ${displayFileName}`;

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={hasError ? "destructive" : variant} 
        size={size} 
        onClick={handleClick}
        className={`flex items-center gap-2 ${className}`}
        disabled={isButtonDisabled}
        title={buttonTitle}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isDownloading ? "Téléchargement..." : hasError ? "Réessayer" : label}
      </Button>
      <span className="text-xs text-gray-500">
        {displayFileName}
      </span>
    </div>
  );
};
