
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Utiliser Promise.race avec setTimeout pour implémenter un timeout
    const timeoutPromise = new Promise<ActionResponse>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: false, 
          error: "La requête a pris trop de temps. Veuillez rafraîchir la page pour vérifier si l'utilisateur a été supprimé." 
        });
      }, 30000); // 30 secondes de timeout
    });
    
    // Appeler la fonction Edge
    const functionPromise = new Promise<ActionResponse>(async (resolve) => {
      try {
        const { error: authError } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        
        if (authError) {
          console.error("Erreur lors de la suppression de l'utilisateur de auth.users:", authError);
          resolve({ success: false, error: authError.message });
        } else {
          console.log("Utilisateur supprimé avec succès:", userId);
          resolve({ success: true });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Exception lors de la suppression de l'utilisateur:", error);
        resolve({ success: false, error: errorMessage });
      }
    });
    
    // Utiliser Promise.race pour implémenter le timeout
    return await Promise.race([functionPromise, timeoutPromise]);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors de la suppression de l'utilisateur:", error);
    
    return { success: false, error: errorMessage };
  }
};

// Renvoyer une invitation
export const resendInvitation = async (email: string): Promise<ActionResponse> => {
  console.log("Tentative de renvoi d'invitation à:", email);
  
  try {
    // Utiliser Promise.race avec setTimeout pour implémenter un timeout
    const timeoutPromise = new Promise<ActionResponse>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: false, 
          error: "La requête a pris trop de temps. Veuillez rafraîchir la page pour vérifier votre boîte mail." 
        });
      }, 30000); // 30 secondes de timeout
    });
    
    // Appeler la fonction Edge
    const functionPromise = new Promise<ActionResponse>(async (resolve) => {
      try {
        const { error } = await supabase.functions.invoke('resend-invitation', {
          body: { email }
        });
        
        if (error) {
          console.error("Erreur lors du renvoi de l'invitation:", error);
          resolve({ success: false, error: error.message });
        } else {
          console.log("Invitation renvoyée avec succès à:", email);
          resolve({ success: true });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Exception lors du renvoi de l'invitation:", error);
        resolve({ success: false, error: errorMessage });
      }
    });
    
    // Utiliser Promise.race pour implémenter le timeout
    return await Promise.race([functionPromise, timeoutPromise]);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    
    return { success: false, error: errorMessage };
  }
};
