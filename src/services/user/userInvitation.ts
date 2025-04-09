
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Renvoyer une invitation
export const resendInvitation = async (email: string): Promise<ActionResponse & { userExists?: boolean; actionUrl?: string; emailProvider?: string; smtpConfigured?: boolean }> => {
  console.log("Tentative de renvoi d'invitation à:", email);
  
  try {
    // Obtenir l'URL de base actuelle de l'application (fonctionne en dev et prod)
    const origin = window.location.origin;
    console.log("URL de base pour redirection:", origin);
    
    // URL de redirection pour la page de réinitialisation de mot de passe
    // Assurons-nous d'avoir ?type=invite pour une meilleure détection du mode
    const redirectUrl = `${origin}/reset-password?type=invite`;
    console.log("URL de redirection complète:", redirectUrl);
    
    // Implémenter un timeout côté client
    const timeoutPromise = new Promise<{ success: boolean, warning: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          warning: "L'opération a pris plus de 8 secondes. L'email a peut-être été envoyé, veuillez vérifier."
        });
      }, 8000);
    });
    
    // Appel à la fonction Edge avec plus de détails pour le débogage
    console.log("Appel à la fonction Edge resend-invitation avec:", { email, redirectUrl });
    const invitePromise = supabase.functions.invoke('resend-invitation', { 
      body: { 
        email, 
        redirectUrl,
        checkSmtpConfig: true // Demande de vérifier la configuration SMTP
      }
    });
    
    // Race entre le timeout et l'appel à la fonction
    const result = await Promise.race([invitePromise, timeoutPromise]);
    
    // Si c'est le timeout qui a gagné
    if ('warning' in result) {
      console.warn("Délai dépassé, mais l'email a peut-être été envoyé");
      return result;
    }
    
    // Sinon c'est la réponse de la fonction
    const { data, error } = result;
    
    // Vérifier les erreurs
    if (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.error("Réponse négative lors de l'envoi de l'email:", data);
      return { success: false, error: data?.error || "Échec de l'envoi de l'email" };
    }
    
    console.log("Email envoyé avec succès à:", email, "Données de réponse:", data);
    return { 
      success: true,
      userExists: data.userExists || false,
      actionUrl: data.actionUrl || undefined,
      emailProvider: data.emailProvider || undefined,
      smtpConfigured: data.smtpConfigured || false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    console.error("Exception lors de l'envoi de l'email:", error);
    return { success: false, error: errorMessage };
  }
};
