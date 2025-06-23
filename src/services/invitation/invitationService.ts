
import { supabase } from "@/integrations/supabase/client";

export interface CreateInvitationData {
  email: string;
  name: string;
  role: 'admin' | 'growth' | 'sdr';
}

export interface InvitationResponse {
  success: boolean;
  error?: string;
  invitationUrl?: string;
  invitation?: any;
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
        created_by: user.id
      }
    });
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      throw error;
    }
    
    if (!result || !result.success) {
      console.error("❌ Échec création invitation:", result);
      throw new Error(result?.error || "Échec création invitation");
    }
    
    console.log("✅ Invitation créée avec succès");
    return {
      success: true,
      invitationUrl: result.invitationUrl,
      invitation: result.invitation
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception création invitation:", error);
    return { success: false, error: errorMessage };
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
