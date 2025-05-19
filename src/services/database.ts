
// Importations existantes
import { supabase } from "@/integrations/supabase/client";

// Fonction pour télécharger un fichier
export const downloadFile = async (url: string, fileName: string): Promise<boolean> => {
  try {
    // Pour les URLs de stockage Supabase
    if (url.includes('storage/v1')) {
      const { data, error } = await supabase.storage.from('files').download(url);
      
      if (error) {
        console.error("Erreur lors du téléchargement depuis Supabase:", error);
        return false;
      }
      
      // Créer un lien de téléchargement pour le blob
      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } 
    // Pour les URLs standards (http/https)
    else if (url.startsWith('http')) {
      // Utiliser fetch pour récupérer le fichier
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    else {
      console.error("Format d'URL non supporté:", url);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return false;
  }
};

// Fonction pour vérifier si un fichier existe
export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    // Pour les URLs de stockage Supabase
    if (url.includes('storage/v1')) {
      // Extraire le chemin du fichier à partir de l'URL
      const path = url.split('/').slice(3).join('/');
      
      // Vérifier l'existence du fichier via l'API Supabase
      const { data, error } = await supabase.storage.from('files').list(path.split('/').slice(0, -1).join('/'));
      
      if (error) {
        console.error("Erreur lors de la vérification via Supabase:", error);
        return false;
      }
      
      // Vérifier si le fichier est dans la liste
      const fileName = path.split('/').pop();
      return data.some(file => file.name === fileName);
    } 
    // Pour les URLs standards (http/https)
    else if (url.startsWith('http')) {
      // Utiliser un HEAD request pour vérifier l'existence
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
    else {
      console.error("Format d'URL non supporté pour la vérification:", url);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du fichier:", error);
    return false;
  }
};

// Fonction pour extraire le nom de fichier d'une URL
export const extractFileName = (url: string): string | null => {
  try {
    // Récupérer le dernier segment de l'URL (après le dernier '/')
    const segments = url.split('/');
    let fileName = segments[segments.length - 1];
    
    // Si l'URL contient des paramètres, les supprimer
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }
    
    // Décoder le nom du fichier au cas où il contiendrait des caractères spéciaux encodés
    fileName = decodeURIComponent(fileName);
    
    return fileName || null;
  } catch (e) {
    console.error("Erreur lors de l'extraction du nom de fichier:", e);
    return null;
  }
};

// Exporter les fonctions manquantes depuis les modules appropriés
export { uploadFile, uploadDatabaseFile } from './database/uploadService';
export { downloadDatabaseFile } from './database/downloadService';
export { getAllDatabaseFiles } from './database/queryService';
export { extractPathFromSupabaseUrl } from './database/utils';
export { deleteDatabaseFile } from './database/deleteService';

// Ajouter ces fonctions à l'export par défaut pour compatibilité
