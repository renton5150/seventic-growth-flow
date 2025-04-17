
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Renvoyer une invitation
export const resendInvitation = async (userId: string): Promise<ActionResponse & { userExists?: boolean; actionUrl?: string; emailProvider?: string; smtpConfigured?: boolean }> => {
  try {
    // Vérifier d'abord si nous avons un email ou un ID d'utilisateur
    let email = userId;
    
    // Si cela ressemble à un UUID, cherchons l'email associé
    if (userId.includes("-") && userId.length > 30) {
      console.log("Identifiant détecté comme UUID, recherche de l'email associé");
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.error("Erreur lors de la récupération de l'email:", userError);
        return { success: false, error: `Impossible de trouver l'utilisateur avec l'ID ${userId}` };
      }
      
      email = userData.email;
      console.log(`Email trouvé pour l'utilisateur ${userId}: ${email}`);
    }
    
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
    
    // Augmenter le délai avant timeout pour éviter les expirations prématurées
    const invitePromise = supabase.functions.invoke('resend-invitation', { 
      body: { 
        email, // Utiliser l'email au lieu de l'ID
        redirectUrl,
        checkSmtpConfig: true,
        debug: true,
        // Ajouter une durée de validité plus longue pour l'invitation
        inviteOptions: {
          expireIn: 604800 // 7 jours en secondes au lieu de la valeur par défaut de 24h
        }
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
