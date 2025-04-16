
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Supprime une demande par son ID
 * @param requestId ID de la demande à supprimer
 * @returns boolean indiquant si la suppression a réussi
 */
export const deleteRequest = async (requestId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression de la demande ${requestId}`);
    
    // Récupérer d'abord les informations de l'utilisateur actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Erreur lors de la récupération de l'utilisateur:", userError);
      toast.error("Erreur d'authentification");
      return false;
    }
    
    if (!user) {
      console.error("Utilisateur non authentifié");
      toast.error("Vous devez être connecté pour supprimer une demande");
      return false;
    }
    
    console.log(`Utilisateur ${user.id} tente de supprimer la demande ${requestId}`);
    
    // Exécuter la suppression
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)
      .or(`created_by.eq.${user.id}`); // S'assurer que l'utilisateur ne peut supprimer que ses propres demandes
      
    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      toast.error(`Échec de la suppression: ${error.message}`);
      return false;
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la demande:", error);
    toast.error("Une erreur inattendue s'est produite");
    return false;
  }
};
