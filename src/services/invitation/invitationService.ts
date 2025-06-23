
import { supabase } from "@/integrations/supabase/client";

export interface CreateInvitationData {
  email: string;
  name: string;
  role: 'admin' | 'growth' | 'sdr';
}

export interface InvitationResponse {
  success: boolean;
  error?: string;
  user?: any;
  userExists?: boolean;
  method?: string;
  tempPassword?: string;
  actionLink?: string;
}

// Créer un utilisateur directement avec mot de passe temporaire
export const createUserDirectly = async (data: CreateInvitationData): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Création utilisateur direct:", data);
    
    if (!data.email || !data.email.includes('@')) {
      console.error("❌ Email invalide:", data.email);
      return {
        success: false,
        error: 'Email invalide'
      };
    }
    
    if (!data.name || data.name.trim() === '') {
      console.error("❌ Nom manquant");
      return {
        success: false,
        error: 'Le nom est obligatoire'
      };
    }
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: data.email,
        userName: data.name,
        userRole: data.role,
        action: 'create_direct'
      }
    });
    
    console.log("📥 Réponse fonction Edge:", result);
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result || !result.success) {
      console.error("❌ Échec création utilisateur:", result);
      return {
        success: false,
        error: result?.error || "Échec création utilisateur"
      };
    }
    
    console.log("✅ Utilisateur créé directement avec succès");
    return {
      success: true,
      user: result.user,
      tempPassword: result.tempPassword,
      actionLink: result.actionLink,
      method: result.method,
      userExists: result.userExists
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception création utilisateur direct:", error);
    return { 
      success: false, 
      error: `Erreur système: ${errorMessage}` 
    };
  }
};

// Envoyer une invitation par email
export const createInvitation = async (data: CreateInvitationData): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Envoi invitation email:", data);
    
    if (!data.email || !data.email.includes('@')) {
      console.error("❌ Email invalide:", data.email);
      return {
        success: false,
        error: 'Email invalide'
      };
    }
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: data.email,
        userName: data.name || data.email.split('@')[0],
        userRole: data.role,
        action: 'invite'
      }
    });
    
    console.log("📥 Réponse fonction Edge:", result);
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result || !result.success) {
      console.error("❌ Échec envoi invitation:", result);
      return {
        success: false,
        error: result?.error || "Échec envoi invitation"
      };
    }
    
    console.log("✅ Invitation envoyée avec succès");
    return {
      success: true,
      userExists: result.userExists,
      method: result.method,
      actionLink: result.actionLink
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception envoi invitation:", error);
    return { 
      success: false, 
      error: `Erreur système: ${errorMessage}` 
    };
  }
};

// Réinitialiser le mot de passe d'un utilisateur existant
export const resetUserPassword = async (email: string): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Réinitialisation mot de passe:", email);
    
    if (!email || !email.includes('@')) {
      console.error("❌ Email invalide:", email);
      return {
        success: false,
        error: 'Email invalide'
      };
    }
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: email,
        action: 'reset_password'
      }
    });
    
    console.log("📥 Réponse fonction Edge:", result);
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result || !result.success) {
      console.error("❌ Échec réinitialisation:", result);
      return {
        success: false,
        error: result?.error || "Échec réinitialisation mot de passe"
      };
    }
    
    console.log("✅ Lien de réinitialisation envoyé avec succès");
    return {
      success: true,
      method: result.method,
      actionLink: result.actionLink
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception réinitialisation mot de passe:", error);
    return { 
      success: false, 
      error: `Erreur système: ${errorMessage}` 
    };
  }
};

// Fonctions de compatibilité (non utilisées mais conservées)
export const validateInvitationToken = async (token: string) => {
  console.log("validateInvitationToken - fonction legacy, non utilisée");
  return { success: false, error: "Fonction non disponible" };
};

export const completeSignup = async (token: string, password: string) => {
  console.log("completeSignup - fonction legacy, non utilisée");
  return { success: false, error: "Fonction non disponible" };
};

export const getAllInvitations = async () => {
  console.log("getAllInvitations - fonction legacy, non utilisée");
  return { success: true, data: [] };
};
