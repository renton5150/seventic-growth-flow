
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
    
    // Vérifier l'existence de la demande avant de tenter de la supprimer
    const { data: checkData, error: checkError } = await supabase
      .from('requests')
      .select('id, title, mission_id')
      .eq('id', requestId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Erreur lors de la vérification de l'existence de la demande:", checkError);
      toast.error("Erreur lors de la vérification de la demande");
      return false;
    }
    
    if (!checkData) {
      console.error(`La demande ${requestId} n'existe pas dans la base de données`);
      toast.error("Cette demande n'existe pas ou a déjà été supprimée");
      return false;
    }
    
    console.log("Demande trouvée, procédant à la suppression:", checkData);
    
    // D'abord, mettre à jour les références pour éviter les problèmes de contraintes
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        assigned_to: null,
        workflow_status: 'canceled'
      })
      .eq('id', requestId);
      
    if (updateError) {
      console.error("Échec de la préparation pour la suppression:", updateError);
      toast.error(`Impossible de préparer la demande pour la suppression: ${updateError.message}`);
      return false;
    }
    
    // Procéder à la suppression une fois les références nettoyées
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
      
    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      toast.error(`Échec de la suppression: ${error.message}`);
      return false;
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la demande:", error);
    toast.error("Erreur inattendue lors de la suppression");
    return false;
  }
};
