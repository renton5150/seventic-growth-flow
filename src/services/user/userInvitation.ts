
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Renvoyer une invitation
export const resendInvitation = async (userEmail: string): Promise<ActionResponse & { userExists?: boolean; actionUrl?: string; emailProvider?: string; smtpConfigured?: boolean }> => {
  try {
    // Vérifier que l'email est non vide
    if (!userEmail) {
      console.error("Email utilisateur vide");
      return { success: false, error: "L'email de l'utilisateur est vide" };
    }
    
    // Vérifier que l'email est valide
    if (!userEmail.includes('@')) {
      console.error("Format d'email invalide:", userEmail);
      return { success: false, error: `Format d'email invalide: ${userEmail}` };
    }
    
    console.log("Tentative de renvoi d'invitation pour:", userEmail);
    
    // Obtenir l'URL de base actuelle de l'application
    const origin = window.location.origin;
    console.log("URL de base pour redirection:", origin);
    
    // URL de redirection pour la page de réinitialisation de mot de passe
    const redirectUrl = `${origin}/reset-password?type=invite`;
    console.log("URL de redirection complète:", redirectUrl);
    
    // Implémenter un timeout côté client plus court (5 secondes)
    const timeoutPromise = new Promise<{ success: boolean, warning: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          warning: "L'opération a pris plus de 5 secondes. L'email a peut-être été envoyé, veuillez vérifier."
        });
      }, 5000);
    });
    
    // Paramètres de requête étendus avec plus de détails pour le débogage
    const requestParams = { 
      email: userEmail,
      redirectUrl,
      checkSmtpConfig: true,
      debug: true,
      timestamp: new Date().toISOString(),
      // Ajouter une durée de validité plus longue pour l'invitation
      inviteOptions: {
        expireIn: 604800 // 7 jours en secondes
      }
    };
    
    // Ajout de logging détaillé
    console.log("Appel à la fonction Edge resend-invitation avec:", JSON.stringify(requestParams, null, 2));
    
    // Appel à la fonction Edge avec l'email
    const invitePromise = supabase.functions.invoke('resend-invitation', { 
      body: requestParams
    }).catch(error => {
      console.error("Erreur lors de l'appel à la fonction Edge:", error);
      return { error: { message: error.message || "Erreur de connexion" } };
    });
    
    // Race entre le timeout et l'appel à la fonction
    const result = await Promise.race([invitePromise, timeoutPromise]);
    
    // Si c'est le timeout qui a gagné
    if ('warning' in result) {
      console.warn("Délai dépassé lors de l'envoi de l'email:", {
        email: userEmail,
        redirectUrl,
        timestamp: new Date().toISOString()
      });
      return result;
    }
    
    // Journaliser la réponse complète pour le débogage
    console.log("Réponse complète de resend-invitation:", JSON.stringify(result, null, 2));
    
    // Vérifier les erreurs dans plusieurs formats possibles
    let errorMessage = null;
    
    if ('error' in result) {
      const error = result.error;
      errorMessage = error?.message || error?.error || (typeof error === 'string' ? error : null);
    }
    
    if (errorMessage) {
      console.error("Erreur lors de l'envoi de l'email:", errorMessage);
      return { success: false, error: errorMessage || "Erreur lors de l'envoi de l'invitation" };
    }

    // Accéder aux données de façon sécurisée
    const data = 'data' in result ? result.data : null;
    
    // Vérifier si la réponse contient des erreurs spécifiques
    if (data?.error) {
      console.error("Erreur dans les données de réponse:", data.error);
      return { success: false, error: data.error };
    }
    
    if (!data || data.success === false) {
      console.error("Réponse négative lors de l'envoi de l'email:", data);
      return { success: false, error: data?.error || "Échec de l'envoi de l'email" };
    }
    
    console.log("Email envoyé avec succès à:", userEmail, "Données de réponse:", data);
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
