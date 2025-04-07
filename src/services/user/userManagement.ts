
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
    // Appeler la fonction Edge avec un délai d'expiration plus long (30 secondes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes
    
    // Appeler la fonction Edge avec signal d'annulation
    const response = await supabase.functions.invoke('resend-invitation', {
      body: { email },
      signal: controller.signal
    });
    
    // Nettoyer le timeout
    clearTimeout(timeoutId);
    
    // Vérifier les erreurs
    if (response.error) {
      console.error("Erreur lors du renvoi de l'invitation:", response.error);
      return { success: false, error: response.error.message };
    }
    
    // Vérifier les réponses de l'API
    if (!response.data) {
      return { success: false, error: "Réponse vide de l'API" };
    }
    
    if (response.data.success === false) {
      console.error("Erreur serveur:", response.data.error);
      return { success: false, error: response.data.error || "Erreur serveur inconnue" };
    }
    
    console.log("Invitation renvoyée avec succès à:", email);
    return { success: true };
  } catch (error) {
    // Gestion spécifique pour les erreurs d'expiration
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Délai d'attente dépassé lors du renvoi de l'invitation");
      return { 
        success: false, 
        error: "L'opération a expiré après 30 secondes. Veuillez rafraîchir la page pour vérifier si l'invitation a été envoyée." 
      };
    }
    
    // Autres erreurs
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    return { success: false, error: errorMessage };
  }
};
