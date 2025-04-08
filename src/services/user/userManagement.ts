
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Appeler la fonction Edge avec un timeout de 10 secondes côté client
    // pour éviter d'attendre indéfiniment
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      // Si l'erreur est due à un timeout
      if (error.message && error.message.includes("aborted")) {
        console.warn("Délai dépassé, mais l'opération continue en arrière-plan");
        return { 
          success: true, 
          warning: "L'opération prend plus de temps que prévu. La suppression continue en arrière-plan."
        };
      }
      
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
    
    // Si c'est une erreur de timeout
    if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
      console.warn("Timeout lors de la suppression, mais l'opération continue");
      return { 
        success: true, 
        warning: "L'opération prend plus de temps que prévu. La suppression continue en arrière-plan."
      };
    }
    
    console.error("Exception lors de la suppression de l'utilisateur:", error);
    return { success: false, error: errorMessage };
  }
};

// Renvoyer une invitation
export const resendInvitation = async (email: string): Promise<ActionResponse> => {
  console.log("Tentative de renvoi d'invitation à:", email);
  
  try {
    // Obtenir l'URL de base actuelle de l'application (fonctionne en dev et prod)
    const origin = window.location.origin;
    console.log("URL de base pour redirection:", origin);
    
    // URL de redirection pour la page de réinitialisation de mot de passe
    // Assurons-nous d'avoir ?type=invite pour une meilleure détection du mode
    const redirectUrl = `${origin}/reset-password?type=invite`;
    console.log("URL de redirection complète:", redirectUrl);
    
    // Créer un timeout manuellement pour éviter les attentes trop longues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Appeler la fonction Edge avec un signal d'annulation
    const { data, error } = await supabase.functions.invoke('resend-invitation', { 
      body: { 
        email, 
        redirectUrl
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Vérifier les erreurs
    if (error) {
      // Si l'erreur est due à un timeout
      if (error.message && error.message.includes("aborted")) {
        console.warn("Délai dépassé, mais l'invitation a peut-être été envoyée");
        return { 
          success: true, 
          warning: "L'opération a pris plus de 8 secondes. L'invitation a peut-être été envoyée, veuillez vérifier."
        };
      }
      
      console.error("Erreur lors du renvoi de l'invitation:", error);
      
      return { success: false, error: error.message };
    }
    
    console.log("Invitation renvoyée avec succès à:", email);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    // Si c'est une erreur de timeout
    if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
      return { 
        success: true, 
        warning: "L'opération a pris plus de temps que prévu. L'invitation a peut-être été envoyée."
      };
    }
    
    console.error("Exception lors du renvoi de l'invitation:", error);
    return { success: false, error: errorMessage };
  }
};
