
import { supabase } from "@/lib/supabase";
import { DatabaseFile } from "@/types/database.types";

// Stockage local pour les bases de données en mode démo
const demoDatabases: DatabaseFile[] = [];

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    if (!isSupabaseConfigured) {
      console.log("Mode démo: simulation de suppression de fichier");
      
      // En mode démo, on retire simplement de la liste locale
      const index = demoDatabases.findIndex(db => db.id === fileId);
      if (index !== -1) {
        demoDatabases.splice(index, 1);
      }
      
      return true;
    }
    
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
    if (!isSupabaseConfigured) {
      console.log("Mode démo: retour des bases de données locales");
      return demoDatabases;
    }
    
    const { data, error } = await supabase
      .from("database_files")
      .select();
      
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
    if (!isSupabaseConfigured) {
      console.log("Mode démo: recherche d'une base de données locale");
      return demoDatabases.find(db => db.id === databaseId) || null;
    }
    
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
