
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, Search, FileQuestion } from 'lucide-react';
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
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [fileStatus, setFileStatus] = useState<'unknown' | 'temp' | 'url' | 'missing'>('unknown');
  const isDownloading = downloading === fileUrl;
  
  // ID unique pour les logs de cette instance
  const buttonId = React.useId();
  
  // Fonction pour extraire le nom réel du fichier depuis une URL temp_
  const getCleanFileName = (url: string, fallbackName: string): string => {
    if (!url) return fallbackName;
    
    try {
      // Si c'est un fichier temp_, extraire le nom réel
      if (url.startsWith('temp_')) {
        const parts = url.split('_');
        if (parts.length >= 3) {
          // Format: temp_timestamp_nomfichier.ext
          const realName = parts.slice(2).join('_');
          return decodeURIComponent(realName);
        }
      }
      
      // Sinon utiliser la logique normale d'extraction
      const segments = url.split('/');
      let name = segments[segments.length - 1];
      
      if (name.includes('?')) {
        name = name.split('?')[0];
      }
      
      return decodeURIComponent(name) || fallbackName;
    } catch (e) {
      return fallbackName;
    }
  };

  const displayFileName = getCleanFileName(fileUrl || '', fileName);
  
  useEffect(() => {
    const checkFileDownloadable = () => {
      if (!fileUrl) {
        console.log(`[Button ${buttonId}] Pas d'URL de fichier fournie`);
        setIsDownloadable(false);
        setHasError(true);
        setFileStatus('missing');
        return;
      }
      
      // Déterminer le type de fichier
      if (fileUrl.startsWith('temp_')) {
        setFileStatus('temp');
        console.log(`[Button ${buttonId}] Fichier temp détecté: ${fileUrl}`);
      } else if (fileUrl.startsWith('http')) {
        setFileStatus('url');
        console.log(`[Button ${buttonId}] URL complète détectée: ${fileUrl}`);
      } else {
        setFileStatus('unknown');
        console.log(`[Button ${buttonId}] Type de fichier inconnu: ${fileUrl}`);
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
    
    // Si c'est un fichier temp_, indiquer qu'on recherche
    if (fileUrl.startsWith('temp_')) {
      setIsSearching(true);
    }
    
    const success = await handleFileDownload(fileUrl, displayFileName);
    
    setIsSearching(false);
    
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
    : `Télécharger ${displayFileName}`;

  // Déterminer l'icône et le texte en fonction de l'état
  const getButtonContent = () => {
    if (isDownloading || isSearching) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isSearching ? "Recherche intelligente..." : "Téléchargement..."}
        </>
      );
    }
    
    if (hasError) {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          Réessayer
        </>
      );
    }
    
    // Icône spéciale selon le type de fichier
    if (fileStatus === 'temp') {
      return (
        <>
          <Search className="h-4 w-4" />
          {label}
        </>
      );
    } else if (fileStatus === 'unknown') {
      return (
        <>
          <FileQuestion className="h-4 w-4" />
          {label}
        </>
      );
    }
    
    return (
      <>
        <Download className="h-4 w-4" />
        {label}
      </>
    );
  };

  // Déterminer le message d'état
  const getStatusMessage = () => {
    if (hasError) {
      if (fileStatus === 'temp') {
        return "Fichier non trouvé - recherche intelligente échouée";
      } else if (fileStatus === 'url') {
        return "Erreur de télé chargement - fichier inaccessible";
      }
      return "Erreur de téléchargement";
    }
    
    if (fileStatus === 'temp') {
      return `Fichier importé (recherche intelligente): ${displayFileName}`;
    } else if (fileStatus === 'url') {
      return `Fichier stocké: ${displayFileName}`;
    } else if (fileStatus === 'unknown') {
      return `Type inconnu: ${displayFileName}`;
    }
    
    return null;
  };

  const statusMessage = getStatusMessage();

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
        {getButtonContent()}
      </Button>
      {statusMessage && (
        <span className={`text-xs ${hasError ? 'text-red-500' : 'text-gray-500'}`}>
          {statusMessage}
        </span>
      )}
    </div>
  );
};
