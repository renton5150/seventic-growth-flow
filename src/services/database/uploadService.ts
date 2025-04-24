
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from "@/types/database.types";
import { isSupabaseConfigured } from "./config";

export const uploadDatabaseFile = async (file: File, userId: string): Promise<boolean> => {
  try {
    // Générer un nom unique pour le fichier
    const fileName = `${Date.now()}_${file.name}`;
    
    // Télécharger le fichier dans le bucket "databases"
    const { data: fileData, error: fileError } = await supabase.storage
      .from("databases")
      .upload(fileName, file);
      
    if (fileError) {
      console.error("Erreur lors du téléchargement du fichier:", fileError);
      return false;
    }
    
    // Obtenir l'URL publique du fichier
    const { data: publicUrlData } = await supabase.storage
      .from("databases")
      .getPublicUrl(fileName);
    
    if (!publicUrlData.publicUrl) {
      console.error("Impossible d'obtenir l'URL publique du fichier");
      return false;
    }
    
    // Obtenir les informations de l'utilisateur pour stocker le nom de l'uploader
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();
      
    if (userError) {
      console.error("Erreur lors de la récupération des informations de l'utilisateur:", userError);
    }
    
    // Enregistrer les métadonnées du fichier dans la table "database_files"
    const { error: metadataError } = await supabase
      .from("database_files")
      .insert({
        name: file.name,
        file_name: fileName,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId,
        uploader_name: userData?.name || "Utilisateur"
      });
      
    if (metadataError) {
      console.error("Erreur lors de l'enregistrement des métadonnées du fichier:", metadataError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement de la base de données:", error);
    return false;
  }
};
