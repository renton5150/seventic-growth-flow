
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ensureDatabaseBucketExists = async (): Promise<boolean> => {
  try {
    console.log("Vérification de l'existence du bucket 'databases'...");
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erreur lors de la récupération des buckets:", listError);
      console.error("Message d'erreur:", listError.message);
      toast.error("Erreur lors de la vérification du stockage");
      return false;
    }
    
    const databaseBucket = buckets?.find(bucket => bucket.name === 'databases');
    
    if (databaseBucket) {
      console.log("Le bucket 'databases' existe déjà");
      const isPublic = await ensureBucketIsPublic('databases');
      return isPublic;
    }
    
    console.log("Le bucket 'databases' n'existe pas. Création en cours...");
    
    const { error: createError } = await supabase.storage.createBucket('databases', {
      public: true,
      fileSizeLimit: 52428800, // 50 Mo en octets
    });
    
    if (createError) {
      console.error("Erreur lors de la création du bucket:", createError);
      console.error("Message d'erreur:", createError.message);
      toast.error("Impossible de créer l'espace de stockage");
      return false;
    }
    
    console.log("Bucket 'databases' créé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur inattendue:", error);
    toast.error("Erreur lors de la configuration du stockage");
    return false;
  }
};

export const ensureBucketIsPublic = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Vérification que le bucket ${bucketName} est public...`);
    
    const { data: bucketDetails, error: getBucketError } = await supabase.storage.getBucket(bucketName);
    
    if (getBucketError) {
      console.error("Erreur lors de la récupération des détails du bucket:", getBucketError);
      console.error("Message d'erreur:", getBucketError.message);
      return false;
    }
    
    if (!bucketDetails.public) {
      console.log(`Le bucket ${bucketName} n'est pas public, tentative de le rendre public...`);
      
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50 Mo
      });
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du bucket:", updateError);
        console.error("Message d'erreur:", updateError.message);
        return false;
      }
      
      console.log(`Bucket ${bucketName} rendu public avec succès`);
    } else {
      console.log(`Le bucket ${bucketName} est déjà public`);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return false;
  }
};
