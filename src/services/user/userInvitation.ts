
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Renvoyer une invitation
export const resendInvitation = async (userIdentifier: string): Promise<ActionResponse & { userExists?: boolean; actionUrl?: string; emailProvider?: string; smtpConfigured?: boolean }> => {
  try {
    // Vérifier que l'identifiant est non vide
    if (!userIdentifier) {
      console.error("Identifiant utilisateur vide");
      return { success: false, error: "L'identifiant de l'utilisateur est vide" };
    }
    
    console.log("Tentative de renvoi d'invitation pour:", userIdentifier);
    
    // Puisque nous avons besoin d'un email, vérifions si l'identifiant est un email
    let email = userIdentifier;
    
    // Si l'identifiant ressemble à un UUID, cherchons l'email associé
    if (userIdentifier.includes("-") && userIdentifier.length > 30) {
      console.log("Identifiant détecté comme UUID, recherche de l'email associé");
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userIdentifier)
        .single();
      
      if (userError || !userData || !userData.email) {
        console.error("Erreur lors de la récupération de l'email:", userError);
        return { success: false, error: `Impossible de trouver l'email de l'utilisateur avec l'ID ${userIdentifier}` };
      }
      
      email = userData.email;
      console.log(`Email trouvé pour l'utilisateur ${userIdentifier}: ${email}`);
    } else if (!email.includes('@')) {
      // Si ce n'est pas un UUID et ce n'est pas un email valide, retourner une erreur
      console.error("L'identifiant fourni n'est ni un email valide ni un UUID");
      return { success: false, error: `L'identifiant fourni n'est pas valide: ${userIdentifier}` };
    }
    
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
    
    // Ajout de logging détaillé
    console.log("Appel à la fonction Edge resend-invitation avec:", { 
      email, 
      redirectUrl,
      timestamp: new Date().toISOString(),
      checkSmtpConfig: true 
    });
    
    // Appel à la fonction Edge avec l'email
    const invitePromise = supabase.functions.invoke('resend-invitation', { 
      body: { 
        email,
        redirectUrl,
        checkSmtpConfig: true,
        debug: true,
        // Ajouter une durée de validité plus longue pour l'invitation
        inviteOptions: {
          expireIn: 604800 // 7 jours en secondes
        }
      }
    }).catch(error => {
      console.error("Erreur lors de l'appel à la fonction Edge:", error);
      return { error: { message: error.message || "Erreur de connexion" } };
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
    // Fix: Vérifier correctement si 'result' est de type FunctionsResponse et a une propriété 'data'
    // Journaliser la réponse complète
    console.log("Réponse complète de la fonction Edge:", JSON.stringify(result, null, 2));
    
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

    // Utiliser un opérateur de coalescence pour accéder à data de façon sécurisée
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
