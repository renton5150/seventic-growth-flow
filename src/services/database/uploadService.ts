
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from "@/types/database.types";
import { isSupabaseConfigured, demoDatabases } from "./config";

// Télécharger un fichier de base de données
export const uploadDatabaseFile = async (file: File, userId: string): Promise<boolean> => {
  try {
    // Générer un nom unique pour le fichier
    const fileName = `${Date.now()}_${file.name}`;
    
    if (!isSupabaseConfigured) {
      console.log("Mode démo: simulation de téléchargement de fichier");
      
      // En mode démo, on simule la réussite et on ajoute aux données locales
      const newFile: DatabaseFile = {
        id: `db_${Date.now()}`,
        name: file.name,
        fileName: fileName,
        fileUrl: `uploads/${fileName}`,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: userId,
        uploaderName: "Utilisateur (démo)",
        createdAt: new Date().toISOString()
      };
      
      demoDatabases.push(newFile);
      return true;
    }
    
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
        uploader_name: userData?.name || "Utilisateur",
        created_at: new Date().toISOString()
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
