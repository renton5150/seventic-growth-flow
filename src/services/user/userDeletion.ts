
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Vérifier d'abord que l'ID est bien un UUID
    if (!userId || !userId.includes("-") || userId.length < 30) {
      console.error("ID d'utilisateur invalide:", userId);
      return { success: false, error: "ID d'utilisateur invalide" };
    }
    
    // Implémenter un timeout côté client
    const timeoutPromise = new Promise<{ success: boolean, warning: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          warning: "L'opération prend plus de temps que prévu. La suppression continue en arrière-plan."
        });
      }, 10000); // 10 secondes de timeout
    });
    
    // Appel à la fonction Edge delete-user
    console.log("Appel à la fonction Edge delete-user avec userId:", userId);
    const deletePromise = supabase.functions.invoke('delete-user', {
      body: { userId }
    }).catch(error => {
      // Capturer les erreurs réseau ou d'API ici
      console.error("Erreur lors de l'appel à la fonction Edge:", error);
      return { error: { message: error.message || "Erreur de connexion" } };
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
