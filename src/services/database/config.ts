
import { supabase } from "@/integrations/supabase/client";

// Vérifier et créer le bucket de stockage si nécessaire
export const ensureDatabaseBucketExists = async (): Promise<boolean> => {
  try {
    console.log("Vérification de l'existence du bucket 'databases'...");
    
    // Vérifier si le bucket existe déjà
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erreur lors de la récupération des buckets:", listError);
      console.error("Message d'erreur:", listError.message);
      return false;
    }
    
    // Vérifier si le bucket 'databases' existe
    const databaseBucket = buckets?.some(bucket => bucket.name === 'databases');
    
    if (databaseBucket) {
      console.log("Le bucket 'databases' existe déjà");
      
      // Si le bucket existe, vérifier qu'il est public et mettre à jour si nécessaire
      try {
        const { data: bucketDetails, error: getBucketError } = await supabase.storage.getBucket('databases');
        
        if (getBucketError) {
          console.error("Erreur lors de la récupération des détails du bucket:", getBucketError);
          console.error("Message d'erreur:", getBucketError.message);
        } else {
          console.log("Détails actuels du bucket:", bucketDetails);
          
          // Si le bucket n'est pas public, le rendre public
          if (!bucketDetails.public) {
            console.log("Le bucket n'est pas public, tentative de le rendre public...");
            
            const { error: updateError } = await supabase.storage.updateBucket('databases', {
              public: true,
              fileSizeLimit: 52428800 // 50 Mo en octets
            });
            
            if (updateError) {
              console.error("Erreur lors de la mise à jour du bucket 'databases':", updateError);
              console.error("Message d'erreur:", updateError.message);
            } else {
              console.log("Le bucket 'databases' est maintenant configuré comme public");
            }
          } else {
            console.log("Le bucket 'databases' est déjà public");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification/mise à jour du bucket:", error);
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
      console.error("Message d'erreur:", createError.message);
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
      console.error("Message d'erreur:", getBucketError.message);
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
        console.error("Message d'erreur:", error.message);
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
