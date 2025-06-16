
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadDatabaseFile, extractFileName } from '@/services/database';

export const useFileDownload = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleFileDownload = async (fileUrl: string | undefined, defaultFilename: string = "document") => {
    if (!fileUrl) {
      toast.error("URL du fichier invalide");
      return false;
    }
    
    if (downloading === fileUrl) {
      console.log(`[useFileDownload] Téléchargement déjà en cours pour ${fileUrl}`);
      return false; // Éviter les téléchargements multiples
    }
    
    try {
      setDownloading(fileUrl);
      const requestId = Math.random().toString(36).substring(7);
      console.log(`[useFileDownload:${requestId}] Début du processus de téléchargement pour: ${fileUrl}`);
      
      // Extraire le nom de fichier de l'URL ou utiliser le nom par défaut
      const fileName = extractFileName(fileUrl) || defaultFilename;
      console.log(`[useFileDownload:${requestId}] Téléchargement demandé pour: ${fileUrl}, nom: ${fileName}`);
      
      const downloadToast = toast.loading("Téléchargement en cours...");
      
      const success = await downloadDatabaseFile(fileUrl, fileName);
      
      // Supprimer le toast de chargement
      toast.dismiss(downloadToast);
      
      if (!success) {
        console.error(`[useFileDownload:${requestId}] Échec du téléchargement pour ${fileUrl}`);
        toast.error("Erreur lors du téléchargement du fichier");
        return false;
      } else {
        console.log(`[useFileDownload:${requestId}] Téléchargement réussi pour ${fileUrl}`);
        toast.success(`Fichier "${fileName}" téléchargé avec succès`);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
      return false;
    } finally {
      setDownloading(null);
    }
  };

  return {
    downloading,
    handleFileDownload
  };
};
