
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFile } from "@/types/database.types";
import { isSupabaseConfigured } from "./config";

export const uploadDatabaseFile = async (file: File, userId: string): Promise<{success: boolean; fileUrl?: string}> => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.error("Supabase n'est pas configuré correctement");
      return { success: false };
    }
    
    // Générer un nom unique pour le fichier (garder les caractères spéciaux au minimum)
    const uniquePrefix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${uniquePrefix}_${safeFileName}`;
    
    console.log(`Téléchargement du fichier ${fileName} vers le bucket 'databases'...`);
    
    // Télécharger le fichier dans le bucket "databases" avec les bons headers
    const { data: fileData, error: fileError } = await supabase.storage
      .from("databases")
      .upload(fileName, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      });
      
    if (fileError) {
      console.error("Erreur lors du téléchargement du fichier:", fileError);
      return { success: false };
    }
    
    console.log("Fichier téléchargé avec succès. Récupération de l'URL publique...");
    
    // Obtenir l'URL publique du fichier
    const { data: publicUrlData } = await supabase.storage
      .from("databases")
      .getPublicUrl(fileName);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Impossible d'obtenir l'URL publique du fichier");
      return { success: false };
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
    const { data: insertedData, error: metadataError } = await supabase
      .from("database_files")
      .insert({
        name: file.name,
        file_name: fileName,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId,
        uploader_name: userData?.name || "Utilisateur"
      })
      .select()
      .single();
      
    if (metadataError) {
      console.error("Erreur lors de l'enregistrement des métadonnées du fichier:", metadataError);
      // Même en cas d'erreur avec les métadonnées, le fichier a été téléchargé
      // Nous pouvons donc retourner success: true
      return { success: true, fileUrl: publicUrlData.publicUrl };
    }
    
    console.log("Fichier téléchargé et enregistré avec succès:", publicUrlData.publicUrl);
    return { success: true, fileUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Erreur inattendue lors du téléchargement de la base de données:", error);
    return { success: false };
  }
};
