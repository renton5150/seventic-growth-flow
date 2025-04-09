
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
    
    // Ajout de logging détaillé pour le débogage
    console.log("Appel à la fonction Edge resend-invitation avec plus de détails:", { 
      email, 
      redirectUrl,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      windowLocation: window.location.href,
      checkSmtpConfig: true 
    });
    
    // Appel à la fonction Edge avec plus de détails pour le débogage
    const invitePromise = supabase.functions.invoke('resend-invitation', { 
      body: { 
        email, 
        redirectUrl,
        checkSmtpConfig: true, // Demande de vérifier la configuration SMTP
        debug: true // Activer le mode debug
      }
    });
    
    // Race entre le timeout et l'appel à la fonction
    const result = await Promise.race([invitePromise, timeoutPromise]);
    
    // Si c'est le timeout qui a gagné
    if ('warning' in result) {
      console.warn("Délai dépassé lors de l'envoi de l'email:", {
        email,
        redirectUrl,
        timestamp: new Date().toISOString()
      });
      return result;
    }
    
    // Sinon c'est la réponse de la fonction
    const { data, error } = result;
    
    // Journaliser la réponse complète
    console.log("Réponse complète de la fonction Edge:", JSON.stringify(result, null, 2));
    
    // Vérifier les erreurs
    if (error) {
      console.error("Erreur lors de l'envoi de l'email:", error, "Corps de l'erreur:", error.message);
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
