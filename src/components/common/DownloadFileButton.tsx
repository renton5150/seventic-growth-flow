
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
  const isDownloading = downloading === fileUrl;
  
  useEffect(() => {
    const verifyFileExists = async () => {
      if (!fileUrl) {
        setFileExists(false);
        return;
      }
      
      try {
        console.log(`Vérification initiale d'existence pour: ${fileUrl}`);
        const exists = await checkFileExists(fileUrl);
        console.log(`Résultat de la vérification pour ${fileUrl}: ${exists}`);
        setFileExists(exists);
      } catch (error) {
        console.error(`Erreur lors de la vérification du fichier ${fileUrl}:`, error);
        setFileExists(false);
      }
    };
    
    verifyFileExists();
  }, [fileUrl]);

  if (!fileUrl) return null;

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={() => handleFileDownload(fileUrl, fileName)}
      className={`flex items-center gap-2 ${className}`}
      disabled={isDownloading || fileExists === false}
      title={fileExists === false ? "Fichier non disponible" : ""}
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
