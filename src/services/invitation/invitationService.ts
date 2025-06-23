
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
}

// Créer un utilisateur directement avec mot de passe temporaire
export const createUserDirectly = async (data: CreateInvitationData): Promise<InvitationResponse & { tempPassword?: string }> => {
  try {
    console.log("🚀 Création utilisateur direct:", data);
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: data.email,
        userName: data.name,
        userRole: data.role,
        action: 'create_direct'
      }
    });
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result?.success) {
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
      tempPassword: result.user?.tempPassword
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception création utilisateur direct:", error);
    return { success: false, error: errorMessage };
  }
};

// Envoyer une invitation par email (API Supabase native)
export const createInvitation = async (data: CreateInvitationData): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Envoi invitation email:", data);
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: data.email,
        userName: data.name,
        userRole: data.role,
        action: 'invite'
      }
    });
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result?.success) {
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
      method: result.method
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception envoi invitation:", error);
    return { success: false, error: errorMessage };
  }
};

// Réinitialiser le mot de passe d'un utilisateur existant
export const resetUserPassword = async (email: string): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Réinitialisation mot de passe:", email);
    
    const { data: result, error } = await supabase.functions.invoke('simple-email-invite', {
      body: {
        email: email,
        action: 'reset_password'
      }
    });
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return {
        success: false,
        error: `Erreur de connexion: ${error.message}`
      };
    }
    
    if (!result?.success) {
      console.error("❌ Échec réinitialisation:", result);
      return {
        success: false,
        error: result?.error || "Échec réinitialisation mot de passe"
      };
    }
    
    console.log("✅ Lien de réinitialisation envoyé avec succès");
    return {
      success: true,
      method: result.method
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception réinitialisation mot de passe:", error);
    return { success: false, error: errorMessage };
  }
};

// Pour compatibilité - fonctions conservées mais simplifiées
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
