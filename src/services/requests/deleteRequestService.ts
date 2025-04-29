
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
    
    // Procéder à la suppression
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
      
    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      
      // Vérifier s'il s'agit d'une erreur de contrainte de clé étrangère
      if (error.code === '23503') {
        console.error("Erreur de contrainte de clé étrangère. Tentative de mise à jour des références...");
        
        // Tenter de supprimer en invalidant toutes les références
        try {
          // Mettre à jour les références avant de supprimer
          const { error: updateError } = await supabase
            .rpc('prepare_request_for_deletion', { request_id: requestId });
            
          if (updateError) {
            console.error("Échec de la préparation pour la suppression:", updateError);
            toast.error(`Impossible de supprimer cette demande: ${error.message}`);
            return false;
          }
          
          // Nouvelle tentative de suppression après préparation
          const { error: secondDeleteError } = await supabase
            .from('requests')
            .delete()
            .eq('id', requestId);
            
          if (secondDeleteError) {
            console.error("Échec de la seconde tentative de suppression:", secondDeleteError);
            toast.error(`Échec de la suppression: ${secondDeleteError.message}`);
            return false;
          }
        } catch (prepError) {
          console.error("Erreur lors de la préparation pour la suppression:", prepError);
          toast.error("Erreur lors de la suppression de la demande");
          return false;
        }
      } else {
        toast.error(`Échec de la suppression: ${error.message}`);
        return false;
      }
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    
    // Force l'invalidation de tous les caches liés aux demandes
    try {
      const queryClient = useQueryClient();
      if (queryClient) {
        console.log("Invalidation du cache pour les requêtes");
        // Invalidate query cache
        queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
        queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
      }
    } catch (cacheError) {
      // Ne pas échouer si l'invalidation du cache ne fonctionne pas
      console.warn("Impossible d'invalider le cache automatiquement:", cacheError);
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la demande:", error);
    toast.error("Erreur inattendue lors de la suppression");
    return false;
  }
};
