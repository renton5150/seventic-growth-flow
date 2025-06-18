
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
    
    // Vérifier que chaque bucket requis existe
    for (const bucketName of REQUIRED_BUCKETS) {
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        console.log(`Le bucket '${bucketName}' existe`);
      } else {
        console.error(`Le bucket '${bucketName}' n'existe pas`);
        toast.error(`Le bucket de stockage '${bucketName}' n'existe pas`);
        allBucketsExist = false;
      }
    }
    
    if (allBucketsExist) {
      console.log("Tous les buckets requis sont disponibles");
    }
    
    return allBucketsExist;
  } catch (error) {
    console.error("Erreur inattendue:", error);
    toast.error("Erreur lors de la vérification du stockage");
    return false;
  }
};

export const ensureBucketIsPublic = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Vérification que le bucket ${bucketName} est accessible...`);
    
    const { data: bucketDetails, error: getBucketError } = await supabase.storage.getBucket(bucketName);
    
    if (getBucketError) {
      console.error("Erreur lors de la récupération des détails du bucket:", getBucketError);
      console.error("Message d'erreur:", getBucketError.message);
      return false;
    }
    
    if (bucketDetails.public) {
      console.log(`Le bucket ${bucketName} est public et accessible`);
      return true;
    } else {
      console.warn(`Le bucket ${bucketName} n'est pas public`);
      return false;
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return false;
  }
};
