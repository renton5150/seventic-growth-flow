
import React from 'react';
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
  const isDownloading = downloading === fileUrl;

  if (!fileUrl) return null;

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={() => handleFileDownload(fileUrl, fileName)}
      className={`flex items-center gap-2 ${className}`}
      disabled={isDownloading}
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
