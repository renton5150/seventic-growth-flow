
import { supabase } from "@/integrations/supabase/client";

// Vérifier et créer le bucket de stockage si nécessaire
export const ensureDatabaseBucketExists = async (): Promise<boolean> => {
  try {
    console.log("Vérification de l'existence du bucket 'databases'...");
    
    // Vérifier si le bucket existe déjà
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erreur lors de la récupération des buckets:", listError);
      return false;
    }
    
    // Vérifier si le bucket 'databases' existe
    const databaseBucketExists = buckets?.some(bucket => bucket.name === 'databases');
    
    if (databaseBucketExists) {
      console.log("Le bucket 'databases' existe déjà");
      
      // Si le bucket existe, vérifier qu'il est public
      const { error: updateError } = await supabase.storage.updateBucket('databases', {
        public: true,
        fileSizeLimit: 52428800 // 50 Mo en octets
      });
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du bucket 'databases':", updateError);
      } else {
        console.log("Le bucket 'databases' est configuré comme public");
      }
      
      return true;
    }
    
    // Créer le bucket s'il n'existe pas
    console.log("Création du bucket 'databases'...");
    
    const { error: createError } = await supabase.storage.createBucket('databases', {
      public: true,
      fileSizeLimit: 52428800, // 50 Mo en octets
    });
    
    if (createError) {
      console.error("Erreur lors de la création du bucket 'databases':", createError);
      return false;
    }
    
    console.log("Bucket 'databases' créé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification/création du bucket:", error);
    return false;
  }
};

// Fonction pour rendre un bucket public s'il ne l'est pas déjà
export const ensureBucketIsPublic = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Vérification que le bucket ${bucketName} est public...`);
    
    const { error } = await supabase.storage.updateBucket(bucketName, {
      public: true
    });
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} rendu public avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du bucket ${bucketName}:`, error);
    return false;
  }
};
