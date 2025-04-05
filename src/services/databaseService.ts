
import { supabase } from '../lib/supabase';

export interface DatabaseFile {
  id: string;
  name: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: Date;
  size: number;
  rowsCount?: number | null;
}

// Télécharger un fichier de base de données
export const uploadDatabaseFile = async (
  file: File,
  userId: string
): Promise<DatabaseFile | null> => {
  try {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `databases/${fileName}`;

    // Télécharger le fichier vers le stockage Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('databases')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erreur lors du téléchargement du fichier:', uploadError);
      throw uploadError;
    }

    // Obtenir l'URL publique du fichier
    const { data: urlData } = await supabase.storage
      .from('databases')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Impossible d'obtenir l'URL du fichier");
    }

    // Créer un enregistrement dans la table des bases de données
    const databaseRecord = {
      name: file.name,
      file_url: urlData.publicUrl,
      uploaded_by: userId,
      size: file.size,
      rows_count: null // On pourrait calculer ça plus tard
    };

    const { data: dbData, error: dbError } = await supabase
      .from('databases')
      .insert(databaseRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Erreur lors de la création de l\'enregistrement de base de données:', dbError);
      throw dbError;
    }

    // Retourner les données formatées pour l'application
    return {
      id: dbData.id,
      name: dbData.name,
      fileUrl: dbData.file_url,
      uploadedBy: dbData.uploaded_by,
      createdAt: new Date(dbData.created_at),
      size: dbData.size,
      rowsCount: dbData.rows_count
    };
  } catch (error) {
    console.error('Erreur lors du téléchargement de la base de données:', error);
    return null;
  }
};

// Obtenir toutes les bases de données
export const getAllDatabases = async (): Promise<DatabaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('databases')
      .select('*, users:uploaded_by(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des bases de données:', error);
      throw error;
    }

    return data.map(db => ({
      id: db.id,
      name: db.name,
      fileUrl: db.file_url,
      uploadedBy: db.uploaded_by,
      uploaderName: db.users?.name,
      createdAt: new Date(db.created_at),
      size: db.size,
      rowsCount: db.rows_count
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des bases de données:', error);
    return [];
  }
};

// Obtenir une base de données par ID
export const getDatabaseById = async (id: string): Promise<DatabaseFile | null> => {
  try {
    const { data, error } = await supabase
      .from('databases')
      .select('*, users:uploaded_by(name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la base de données:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      fileUrl: data.file_url,
      uploadedBy: data.uploaded_by,
      uploaderName: data.users?.name,
      createdAt: new Date(data.created_at),
      size: data.size,
      rowsCount: data.rows_count
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la base de données:', error);
    return null;
  }
};

// Supprimer une base de données
export const deleteDatabase = async (id: string): Promise<boolean> => {
  try {
    // Récupérer les informations de la base de données
    const { data, error: fetchError } = await supabase
      .from('databases')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erreur lors de la récupération des informations de la base de données:', fetchError);
      throw fetchError;
    }

    // Extraire le chemin du fichier à partir de l'URL
    const fileUrl = data.file_url;
    const filePath = fileUrl.split('/').pop();

    if (!filePath) {
      throw new Error('Chemin de fichier invalide');
    }

    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from('databases')
      .remove([`databases/${filePath}`]);

    if (storageError) {
      console.error('Erreur lors de la suppression du fichier:', storageError);
      // Continuez malgré l'erreur pour supprimer l'entrée de base de données
    }

    // Supprimer l'enregistrement de la base de données
    const { error: dbError } = await supabase
      .from('databases')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Erreur lors de la suppression de l\'enregistrement de la base de données:', dbError);
      throw dbError;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la base de données:', error);
    return false;
  }
};
