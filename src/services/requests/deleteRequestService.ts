
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Supprime une demande par son ID avec vérification des permissions
 * @param requestId ID de la demande à supprimer
 * @returns boolean indiquant si la suppression a réussi
 */
export const deleteRequest = async (requestId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression de la demande ${requestId}`);
    
    // Vérifier l'existence de la demande avant de tenter de la supprimer
    const { data: checkData, error: checkError } = await supabase
      .from('requests')
      .select('id, title, mission_id, workflow_status, created_by')
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
    
    // Récupérer les informations de l'utilisateur actuel pour la journalisation
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    console.log(`Utilisateur effectuant la suppression: ${currentUserId}`);
    
    // Étape 1: Vérifier et nettoyer les références potentielles dans les tables liées (Acelle, etc.)
    // Si la demande est de type email, vérifier les références dans les campagnes Acelle
    if (checkData.workflow_status === 'completed' && checkData.mission_id) {
      console.log(`Vérification des références externes pour la demande complétée ${requestId}`);
      // Ici, vous pourriez ajouter du code pour nettoyer les références dans d'autres tables si nécessaire
    }
    
    // Étape 2: Procéder à la suppression
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
      
    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      
      // Messages d'erreur plus détaillés selon le type d'erreur
      if (error.code === '23503') {
        toast.error("Cette demande ne peut pas être supprimée car elle est référencée par d'autres éléments");
      } else if (error.code === '42501') {
        toast.error("Vous n'avez pas les permissions nécessaires pour supprimer cette demande");
      } else {
        toast.error(`Échec de la suppression: ${error.message}`);
      }
      return false;
    }
    
    console.log(`Demande ${requestId} supprimée avec succès`);
    toast.success("Demande supprimée avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la demande:", error);
    toast.error("Erreur inattendue lors de la suppression");
    return false;
  }
};
