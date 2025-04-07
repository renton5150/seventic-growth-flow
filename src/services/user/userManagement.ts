
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
    // Appeler la fonction Edge avec un timeout
    const { data, error } = await supabase.functions.invoke('resend-invitation', {
      body: { email }
    });
    
    if (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Réponse de la fonction resend-invitation:", data);
    
    if (data && data.success === false) {
      console.error("Erreur serveur:", data.error);
      return { success: false, error: data.error || "Erreur serveur inconnue" };
    }
    
    console.log("Invitation renvoyée avec succès à:", email);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    
    return { success: false, error: errorMessage };
  }
};
