
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

export const resendInvitation = async (userEmail: string): Promise<ActionResponse & { userExists?: boolean; method?: string }> => {
  try {
    if (!userEmail) {
      console.error("Email utilisateur vide");
      return { success: false, error: "L'email de l'utilisateur est vide" };
    }
    
    if (!userEmail.includes('@')) {
      console.error("Format email invalide:", userEmail);
      return { success: false, error: `Format d'email invalide: ${userEmail}` };
    }
    
    console.log("🚀 Envoi invitation simple pour:", userEmail);
    
    const { data, error } = await supabase.functions.invoke('simple-email-invite', { 
      body: { 
        email: userEmail,
        userName: userEmail.split('@')[0], // Nom par défaut basé sur l'email
        userRole: 'sdr' // Rôle par défaut
      }
    });
    
    console.log("📥 Réponse simple-email-invite:", JSON.stringify(data, null, 2));
    
    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      return { success: false, error: error.message || "Erreur lors de l'envoi" };
    }
    
    if (!data || data.success === false) {
      console.error("❌ Échec envoi email:", data);
      return { success: false, error: data?.error || "Échec envoi email" };
    }
    
    console.log("✅ Email envoyé avec succès à:", userEmail);
    return { 
      success: true,
      userExists: data.userExists || false,
      method: data.method || 'unknown'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception envoi email:", error);
    return { success: false, error: errorMessage };
  }
};
