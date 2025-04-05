
import { supabase } from "@/lib/supabase";
import { DatabaseFile } from "@/types/database.types";

// Télécharger un fichier de base de données
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
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();
      
    if (userError) {
      console.error("Erreur lors de la récupération des informations de l'utilisateur:", userError);
    }
    
    // Enregistrer les métadonnées du fichier dans la table "database_files"
    const { error: metadataError } = await supabase
      .from("database_files")
      .insert({
        name: file.name,
        fileName: fileName,
        fileUrl: publicUrlData.publicUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: userId,
        uploaderName: userData?.name || "Utilisateur",
        createdAt: new Date().toISOString()
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

// Supprimer un fichier de base de données
export const deleteDatabaseFile = async (fileId: string): Promise<boolean> => {
  try {
    // Récupérer les métadonnées du fichier
    const { data: fileData, error: fetchError } = await supabase
      .from("database_files")
      .select()
      .eq("id", fileId)
      .single();
      
    if (fetchError) {
      console.error("Erreur lors de la récupération des métadonnées du fichier:", fetchError);
      return false;
    }
    
    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from("databases")
      .remove([fileData.fileName]);
      
    if (storageError) {
      console.error("Erreur lors de la suppression du fichier du stockage:", storageError);
      // Continuer pour supprimer les métadonnées même si la suppression du fichier a échoué
    }
    
    // Supprimer les métadonnées du fichier
    const { error: deleteError } = await supabase
      .from("database_files")
      .delete()
      .eq("id", fileId);
      
    if (deleteError) {
      console.error("Erreur lors de la suppression des métadonnées du fichier:", deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de la base de données:", error);
    return false;
  }
};

// Obtenir toutes les bases de données
export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from("database_files")
      .select()
      .order("createdAt", { ascending: false });
      
    if (error) {
      console.error("Erreur lors de la récupération des bases de données:", error);
      return [];
    }
    
    return data as DatabaseFile[];
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des bases de données:", error);
    return [];
  }
};

// Obtenir une base de données par ID
export const getDatabaseById = async (databaseId: string): Promise<DatabaseFile | null> => {
  try {
    const { data, error } = await supabase
      .from("database_files")
      .select()
      .eq("id", databaseId)
      .single();
      
    if (error) {
      console.error("Erreur lors de la récupération de la base de données:", error);
      return null;
    }
    
    return data as DatabaseFile;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de la base de données:", error);
    return null;
  }
};
