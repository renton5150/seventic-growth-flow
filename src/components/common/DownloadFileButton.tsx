
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useFileDownload } from '@/hooks/useFileDownload';
import { checkFileExists } from '@/services/database';

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
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [hasCheckedExistence, setHasCheckedExistence] = useState(false);
  const isDownloading = downloading === fileUrl;
  
  // ID unique pour les logs de cette instance
  const buttonId = React.useId();
  
  useEffect(() => {
    const verifyFileExists = async () => {
      if (!fileUrl) {
        console.log(`[Button ${buttonId}] Pas d'URL de fichier fournie`);
        setFileExists(false);
        setHasCheckedExistence(true);
        return;
      }
      
      try {
        console.log(`[Button ${buttonId}] Vérification initiale d'existence pour: ${fileUrl}`);
        const exists = await checkFileExists(fileUrl);
        console.log(`[Button ${buttonId}] Résultat de la vérification pour ${fileUrl}: ${exists}`);
        setFileExists(exists);
        setHasCheckedExistence(true);
      } catch (error) {
        console.error(`[Button ${buttonId}] Erreur lors de la vérification du fichier ${fileUrl}:`, error);
        setFileExists(false);
        setHasCheckedExistence(true);
      }
    };
    
    verifyFileExists();
  }, [fileUrl, buttonId]);

  const handleClick = async () => {
    if (!fileUrl) return;
    
    console.log(`[Button ${buttonId}] Clic sur téléchargement pour: ${fileUrl}`);
    
    // Si on n'a pas encore vérifié l'existence ou si la dernière vérification date d'il y a longtemps,
    // on vérifie à nouveau avant de télécharger
    if (!hasCheckedExistence) {
      console.log(`[Button ${buttonId}] Vérification d'existence avant téléchargement pour: ${fileUrl}`);
      const exists = await checkFileExists(fileUrl);
      setFileExists(exists);
      setHasCheckedExistence(true);
      
      if (!exists) {
        console.log(`[Button ${buttonId}] Le fichier n'existe pas, téléchargement annulé: ${fileUrl}`);
        return;
      }
    }
    
    console.log(`[Button ${buttonId}] Lancement du téléchargement pour: ${fileUrl}`);
    await handleFileDownload(fileUrl, fileName);
  };

  if (!fileUrl) {
    console.log(`[Button ${buttonId}] Pas d'URL, button non rendu`);
    return null;
  }

  const isButtonDisabled = isDownloading || (hasCheckedExistence && fileExists === false);
  const buttonTitle = isButtonDisabled 
    ? (fileExists === false ? "Fichier non disponible" : "Téléchargement en cours") 
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
