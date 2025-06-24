import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Liste des buckets requis par l'application - ajout du bucket requests
const REQUIRED_BUCKETS = ['databases', 'templates', 'blacklists', 'requests'];

export const ensureDatabaseBucketExists = async (): Promise<boolean> => {
  return await ensureAllBucketsExist();
};

export const ensureAllBucketsExist = async (): Promise<boolean> => {
  try {
    console.log("Vérification de l'existence des buckets requis...");
    
    // Tentative de récupération des buckets avec gestion d'erreur améliorée
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn("Avertissement lors de la récupération des buckets:", listError);
      console.log("Continuons avec le chargement du formulaire malgré l'erreur de buckets");
      // Ne pas bloquer l'application, juste avertir
      toast.warning("Vérification des buckets échouée, mais l'application continue de fonctionner");
      return true; // Retourner true pour permettre au formulaire de se charger
    }
    
    if (!buckets) {
      console.warn("Aucun bucket retourné par l'API");
      toast.warning("Impossible de vérifier les buckets de stockage");
      return true; // Permettre au formulaire de continuer
    }
    
    console.log("Buckets disponibles:", buckets.map(b => b.name));
    
    // Vérifier que chaque bucket requis existe
    const missingBuckets: string[] = [];
    
    for (const bucketName of REQUIRED_BUCKETS) {
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        console.log(`✓ Le bucket '${bucketName}' existe`);
      } else {
        console.warn(`⚠ Le bucket '${bucketName}' n'existe pas`);
        missingBuckets.push(bucketName);
      }
    }
    
    if (missingBuckets.length > 0) {
      console.warn("Buckets manquants:", missingBuckets);
      toast.warning(`Buckets manquants: ${missingBuckets.join(', ')}. Certaines fonctionnalités peuvent être limitées.`);
      // Ne pas bloquer l'application pour des buckets manquants
      return true;
    }
    
    console.log("✓ Tous les buckets requis sont disponibles");
    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification des buckets:", error);
    console.log("Erreur capturée, permettons au formulaire de se charger quand même");
    // Ne pas bloquer l'application pour une erreur de vérification
    toast.warning("Erreur lors de la vérification du stockage, mais l'application continue");
    return true; // Toujours retourner true pour ne pas bloquer
  }
};

export const ensureBucketIsPublic = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Vérification que le bucket ${bucketName} est accessible...`);
    
    const { data: bucketDetails, error: getBucketError } = await supabase.storage.getBucket(bucketName);
    
    if (getBucketError) {
      console.warn("Avertissement lors de la récupération des détails du bucket:", getBucketError);
      return true; // Ne pas bloquer pour cette vérification
    }
    
    if (!bucketDetails) {
      console.warn(`Le bucket ${bucketName} n'a pas pu être vérifié`);
      return true; // Ne pas bloquer
    }
    
    if (bucketDetails.public) {
      console.log(`✓ Le bucket ${bucketName} est public et accessible`);
      return true;
    } else {
      console.warn(`⚠ Le bucket ${bucketName} n'est pas public`);
      return true; // Ne pas bloquer même si pas public
    }
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification du bucket:", error);
    return true; // Ne pas bloquer l'application
  }
};
