
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadDatabaseFile, checkFileExists, extractFileName } from '@/services/database';

export const useFileDownload = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleFileDownload = async (fileUrl: string | undefined, defaultFilename: string = "document") => {
    if (!fileUrl) {
      toast.error("URL du fichier invalide");
      return false;
    }
    
    if (downloading === fileUrl) {
      return false; // Éviter les téléchargements multiples
    }
    
    try {
      setDownloading(fileUrl);
      
      // Vérifier si le fichier existe avant de tenter le téléchargement
      const exists = await checkFileExists(fileUrl);
      if (!exists) {
        toast.error("Le fichier demandé n'existe plus sur le serveur", {
          description: "Veuillez contacter l'administrateur"
        });
        return false;
      }
      
      // Extraire le nom de fichier de l'URL ou utiliser le nom par défaut
      const fileName = extractFileName(fileUrl) || defaultFilename;
      console.log(`Téléchargement demandé pour: ${fileUrl}, nom: ${fileName}`);
      
      const downloadToast = toast.loading("Téléchargement en cours...");
      
      const success = await downloadDatabaseFile(fileUrl, fileName);
      
      // Supprimer le toast de chargement
      toast.dismiss(downloadToast);
      
      if (!success) {
        toast.error("Erreur lors du téléchargement du fichier");
        return false;
      } else {
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
