
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
    
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
      
    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      return false;
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la demande:", error);
    return false;
  }
};
