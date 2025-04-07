
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Appeler la fonction Edge
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    if (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Utilisateur supprimé avec succès:", userId);
    return { success: true };
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
    // Créer un timeout manuellement
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
      setTimeout(() => {
        resolve({
          error: { 
            message: "L'opération a expiré après 30 secondes. L'email a peut-être été envoyé, veuillez vérifier." 
          }
        });
      }, 30000); // 30 secondes
    });
    
    // Appeler la fonction Edge avec une course contre la montre
    const response = await Promise.race([
      supabase.functions.invoke('resend-invitation', { body: { email } }),
      timeoutPromise
    ]);
    
    // Vérifier si c'est un timeout
    if ('error' in response && response.error?.message?.includes('expiré')) {
      console.warn("Timeout lors de l'envoi de l'invitation:", email);
      return { 
        success: false, 
        error: response.error.message 
      };
    }
    
    // Vérifier les erreurs normales
    if ('error' in response && response.error) {
      console.error("Erreur lors du renvoi de l'invitation:", response.error);
      
      // Message spécifique pour utilisateur introuvable
      if (response.error.message?.includes('introuvable')) {
        return { 
          success: false, 
          error: "Cet email n'est pas associé à un compte existant." 
        };
      }
      
      return { success: false, error: response.error.message };
    }
    
    console.log("Invitation renvoyée avec succès à:", email);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    return { success: false, error: errorMessage };
  }
};
