
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
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Erreur d'authentification:", userError);
      toast.error("Vous devez être connecté pour supprimer une demande");
      return false;
    }
    
    // Supprimer la demande - simplement par ID, sans conditions supplémentaires
    // La RLS de Supabase s'assurera que l'utilisateur ne peut supprimer que ses propres demandes
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
    
    if (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(`Échec de la suppression: ${error.message}`);
      return false;
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    toast.success("Demande supprimée avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression:", error);
    toast.error("Une erreur inattendue s'est produite");
    return false;
  }
};
