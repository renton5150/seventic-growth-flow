
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
    // Log détaillé pour le débogage
    console.log(`Appel à l'Edge Function resend-invitation avec l'email: ${email}`);
    
    // Appeler la fonction Edge avec un timeout explicite
    const response = await supabase.functions.invoke('resend-invitation', { 
      body: { email },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Réponse de l'Edge Function:", response);
    
    // Vérifier si nous avons une erreur
    if (response.error) {
      console.error("Erreur renvoyée par l'Edge Function:", response.error);
      
      if (response.error.message?.includes('not found') || response.error.message?.includes('introuvable')) {
        return { 
          success: false, 
          error: "Cet email n'est pas associé à un compte existant." 
        };
      }
      
      return { success: false, error: response.error.message };
    }
    
    // Vérifier si la réponse contient un message d'erreur dans data
    if (response.data && response.data.error) {
      console.error("Message d'erreur dans data:", response.data.error);
      return { success: false, error: response.data.error };
    }
    
    console.log("Invitation renvoyée avec succès à:", email);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    return { success: false, error: errorMessage };
  }
};
