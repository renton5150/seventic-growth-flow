
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload un fichier vers Supabase Storage
 * @param file Le fichier à uploader
 * @param bucketName Le nom du bucket
 * @param folder Le dossier de destination (optionnel)
 * @returns Résultat de l'upload avec l'URL du fichier
 */
export const uploadFile = async (file: File, bucketName: string, folder?: string): Promise<UploadResult> => {
  try {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[uploadFile:${requestId}] Début upload: ${file.name} vers ${bucketName}/${folder || ''}`);
    
    // Garder le nom original du fichier - PAS DE MODIFICATION
    const fileName = file.name;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    console.log(`[uploadFile:${requestId}] Chemin final: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`[uploadFile:${requestId}] Erreur upload:`, error);
      toast.error(`Erreur lors de l'upload: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error(`[uploadFile:${requestId}] Pas de données retournées`);
      return { success: false, error: "Aucune donnée retournée" };
    }

    // Construire l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`[uploadFile:${requestId}] ✅ Upload réussi: ${urlData.publicUrl}`);
    
    return {
      success: true,
      fileUrl: urlData.publicUrl,
      fileName: fileName
    };
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast.error(`Erreur lors de l'upload: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

/**
 * Upload multiple files
 * @param files Liste des fichiers à uploader
 * @param bucketName Le nom du bucket
 * @param folder Le dossier de destination (optionnel)
 * @returns Liste des résultats d'upload
 */
export const uploadMultipleFiles = async (
  files: File[], 
  bucketName: string, 
  folder?: string
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, bucketName, folder);
    results.push(result);
  }
  
  return results;
};

// Fonction spécifique pour les bases de données
export const uploadDatabaseFile = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'databases');
};

// Fonction spécifique pour les templates
export const uploadTemplateFile = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'templates');
};

// Fonction spécifique pour les blacklists
export const uploadBlacklistFile = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'blacklists');
};
