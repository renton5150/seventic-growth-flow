
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
    const databaseBucket = buckets?.some(bucket => bucket.name === 'databases');
    
    if (databaseBucket) {
      console.log("Le bucket 'databases' existe déjà");
      
      // Si le bucket existe, vérifier qu'il est public
      const { error: updateError } = await supabase.storage.updateBucket('databases', {
        public: true,
        fileSizeLimit: 52428800 // 50 Mo en octets
      });
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du bucket 'databases':", updateError);
        console.log("Tentative de récupération des détails du bucket pour diagnostic...");
        
        const { data: bucketDetails, error: detailsError } = await supabase.storage.getBucket('databases');
        
        if (detailsError) {
          console.error("Impossible d'obtenir les détails du bucket:", detailsError);
        } else {
          console.log("Détails du bucket 'databases':", bucketDetails);
          // Le bucket existe mais ne peut pas être mis à jour, on continue quand même
        }
      } else {
        console.log("Le bucket 'databases' est configuré comme public");
      }
      
      return true;
    }
    
    // Créer le bucket s'il n'existe pas
    console.log("Le bucket 'databases' n'existe pas. Création en cours...");
    
    const { data: createdBucket, error: createError } = await supabase.storage.createBucket('databases', {
      public: true,
      fileSizeLimit: 52428800, // 50 Mo en octets
    });
    
    if (createError) {
      console.error("Erreur lors de la création du bucket 'databases':", createError);
      return false;
    }
    
    console.log("Bucket 'databases' créé avec succès:", createdBucket);
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
    
    // Obtenir les détails actuels du bucket
    const { data: bucketDetails, error: getBucketError } = await supabase.storage.getBucket(bucketName);
    
    if (getBucketError) {
      console.error(`Erreur lors de la récupération des détails du bucket ${bucketName}:`, getBucketError);
      return false;
    }
    
    console.log(`Détails actuels du bucket ${bucketName}:`, bucketDetails);
    
    // Mettre à jour le bucket pour le rendre public s'il ne l'est pas déjà
    if (!bucketDetails.public) {
      console.log(`Le bucket ${bucketName} n'est pas public, tentative de le rendre public...`);
      
      const { data: updatedBucket, error } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50 Mo
      });
      
      if (error) {
        console.error(`Erreur lors de la mise à jour du bucket ${bucketName}:`, error);
        return false;
      }
      
      console.log(`Bucket ${bucketName} rendu public avec succès:`, updatedBucket);
    } else {
      console.log(`Le bucket ${bucketName} est déjà public`);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du bucket ${bucketName}:`, error);
    return false;
  }
};
