
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
  
  // ID unique pour les logs de cette instance
  const buttonId = React.useId();
  
  useEffect(() => {
    const checkFileDownloadable = () => {
      if (!fileUrl) {
        console.log(`[Button ${buttonId}] Pas d'URL de fichier fournie`);
        setIsDownloadable(false);
        setHasError(true);
        return;
      }
      
      console.log(`[Button ${buttonId}] URL de fichier valide: ${fileUrl}`);
      setIsDownloadable(true);
      setHasError(false);
    };
    
    checkFileDownloadable();
  }, [fileUrl, buttonId]);

  const handleClick = async () => {
    if (!fileUrl || !isDownloadable) return;
    
    console.log(`[Button ${buttonId}] Clic sur téléchargement pour: ${fileUrl}`);
    setHasError(false);
    
    const success = await handleFileDownload(fileUrl, fileName);
    if (!success) {
      setHasError(true);
      console.error(`[Button ${buttonId}] Échec du téléchargement pour: ${fileUrl}`);
    }
  };

  if (!fileUrl) {
    console.log(`[Button ${buttonId}] Pas d'URL, button non rendu`);
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
    : `Télécharger ${fileName}`;

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
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Téléchargement...
          </>
        ) : hasError ? (
          <>
            <AlertCircle className="h-4 w-4" />
            Réessayer
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      {hasError && (
        <span className="text-xs text-red-500">Erreur de téléchargement</span>
      )}
    </div>
  );
};
