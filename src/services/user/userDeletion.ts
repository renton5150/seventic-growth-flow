
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Implémenter un timeout côté client sans utiliser AbortController/signal
    const timeoutPromise = new Promise<{ success: boolean, warning: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          warning: "L'opération prend plus de temps que prévu. La suppression continue en arrière-plan."
        });
      }, 10000);
    });
    
    const deletePromise = supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    // Race entre le timeout et l'appel à la fonction
    const result = await Promise.race([deletePromise, timeoutPromise]);
    
    // Si c'est le timeout qui a gagné
    if ('warning' in result) {
      console.warn("Délai dépassé, mais l'opération continue en arrière-plan");
      return result;
    }
    
    // Sinon c'est la réponse de la fonction
    const { data, error } = result;
    
    if (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return { success: false, error: error.message };
    }
    
    // Si la réponse contient un avertissement, le transmettre
    if (data && data.warning) {
      return { 
        success: true,
        warning: data.warning
      };
    }
    
    console.log("Utilisateur supprimé avec succès:", userId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    console.error("Exception lors de la suppression de l'utilisateur:", error);
    return { success: false, error: errorMessage };
  }
};
