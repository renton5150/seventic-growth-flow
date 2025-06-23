
import { supabase } from "@/integrations/supabase/client";

export interface CreateInvitationData {
  email: string;
  name: string;
  role: 'admin' | 'growth' | 'sdr';
  force_create?: boolean;
}

export interface InvitationResponse {
  success: boolean;
  error?: string;
  errorType?: 'active_invitation_exists' | 'user_already_exists' | 'unknown';
  invitationUrl?: string;
  invitation?: any;
  userExists?: boolean;
  existingInvitation?: any;
}

export const createInvitation = async (data: CreateInvitationData): Promise<InvitationResponse> => {
  try {
    console.log("🚀 Création invitation:", data);
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }
    
    const { data: result, error } = await supabase.functions.invoke('user-invitation-system', {
      body: {
        action: 'create_invitation',
        email: data.email,
        name: data.name,
        role: data.role,
        created_by: user.id,
        force_create: data.force_create || false
      }
    });
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return { 
        success: false, 
        error: `Erreur de connexion: ${error.message}`,
        errorType: 'unknown'
      };
    }
    
    if (!result) {
      console.error("❌ Aucune réponse de la fonction Edge");
      return { 
        success: false, 
        error: "Aucune réponse du serveur",
        errorType: 'unknown'
      };
    }
    
    if (!result.success) {
      console.error("❌ Échec création invitation:", result);
      
      // Déterminer le type d'erreur
      let errorType: 'active_invitation_exists' | 'user_already_exists' | 'unknown' = 'unknown';
      if (result.error === 'active_invitation_exists') {
        errorType = 'active_invitation_exists';
      } else if (result.error === 'user_already_exists') {
        errorType = 'user_already_exists';
      }
      
      return { 
        success: false, 
        error: result.message || result.error || "Échec création invitation",
        errorType,
        existingInvitation: result.invitation
      };
    }
    
    console.log("✅ Invitation créée avec succès");
    return {
      success: true,
      invitationUrl: result.invitationUrl,
      invitation: result.invitation,
      userExists: result.userExists
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception création invitation:", error);
    return { 
      success: false, 
      error: errorMessage, 
      errorType: 'unknown' 
    };
  }
};

export const validateInvitationToken = async (token: string) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('user-invitation-system', {
      body: {
        action: 'validate_token',
        token
      }
    });
    
    if (error) throw error;
    
    return result;
  } catch (error) {
    console.error("❌ Erreur validation token:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
};

export const completeSignup = async (token: string, password: string) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('user-invitation-system', {
      body: {
        action: 'complete_signup',
        token,
        password
      }
    });
    
    if (error) throw error;
    
    return result;
  } catch (error) {
    console.error("❌ Erreur finalisation inscription:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
};

export const getAllInvitations = async () => {
  try {
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("❌ Erreur récupération invitations:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
};
