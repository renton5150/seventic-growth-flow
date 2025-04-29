
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Liste des buckets requis par l'application
const REQUIRED_BUCKETS = ['databases', 'templates', 'blacklists'];

export const ensureDatabaseBucketExists = async (): Promise<boolean> => {
  return await ensureAllBucketsExist();
};

export const ensureAllBucketsExist = async (): Promise<boolean> => {
  try {
    console.log("Vérification de l'existence des buckets requis...");
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erreur lors de la récupération des buckets:", listError);
      console.error("Message d'erreur:", listError.message);
      toast.error("Erreur lors de la vérification du stockage");
      return false;
    }
    
    let allBucketsExist = true;
    
    // Vérifier et créer chaque bucket si nécessaire
    for (const bucketName of REQUIRED_BUCKETS) {
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        console.log(`Le bucket '${bucketName}' existe déjà`);
        await ensureBucketIsPublic(bucketName);
      } else {
        console.log(`Le bucket '${bucketName}' n'existe pas. Création en cours...`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50 Mo en octets
        });
        
        if (createError) {
          console.error(`Erreur lors de la création du bucket ${bucketName}:`, createError);
          console.error("Message d'erreur:", createError.message);
          toast.error(`Impossible de créer l'espace de stockage ${bucketName}`);
          allBucketsExist = false;
        } else {
          console.log(`Bucket '${bucketName}' créé avec succès`);
        }
      }
    }
    
    return allBucketsExist;
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
