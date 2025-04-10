
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invalidateUserCache } from "./userQueries";

// Re-export user management functions from modularized files
export { deleteUser } from "./userDeletion";
export { resendInvitation } from "./userInvitation";

// Export the cache invalidation function
export { invalidateUserCache };

// Utility function to update a user's role with optimized performance
export const updateUserRole = async (userId: string, newRole: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Mise à jour du rôle pour l'utilisateur ${userId} vers ${newRole}`);
    
    // Optimisation : utiliser un upsert pour garantir que la mise à jour se fait en une seule opération
    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    
    if (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      return { success: false, error: error.message };
    }
    
    // Exécution différée de l'invalidation pour permettre à l'UI de se rafraichir d'abord
    setTimeout(() => {
      invalidateUserCache();
    }, 100);
    
    return { success: true };
    
  } catch (error: any) {
    console.error("Exception lors de la mise à jour du rôle:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue lors de la mise à jour du rôle"
    };
  }
};
