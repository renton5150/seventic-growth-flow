
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
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
  const isDownloading = downloading === fileUrl;
  
  // ID unique pour les logs de cette instance
  const buttonId = React.useId();
  
  useEffect(() => {
    const checkFileDownloadable = () => {
      if (!fileUrl) {
        console.log(`[Button ${buttonId}] Pas d'URL de fichier fournie`);
        setIsDownloadable(false);
        return;
      }
      
      console.log(`[Button ${buttonId}] URL de fichier valide: ${fileUrl}`);
      // Si on a une URL qui semble valide, on laisse la possibilité de télécharger
      setIsDownloadable(true);
    };
    
    checkFileDownloadable();
  }, [fileUrl, buttonId]);

  const handleClick = async () => {
    if (!fileUrl || !isDownloadable) return;
    
    console.log(`[Button ${buttonId}] Clic sur téléchargement pour: ${fileUrl}`);
    await handleFileDownload(fileUrl, fileName);
  };

  if (!fileUrl) {
    console.log(`[Button ${buttonId}] Pas d'URL, button non rendu`);
    return null;
  }

  const isButtonDisabled = isDownloading || !isDownloadable;
  const buttonTitle = isButtonDisabled 
    ? (isDownloading ? "Téléchargement en cours" : "Fichier non disponible") 
    : `Télécharger ${fileName}`;

  return (
    <Button 
      variant={variant} 
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
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
};
