
import { supabase } from "@/integrations/supabase/client";

/**
 * Configure une session d'authentification avec les tokens fournis
 */
export const configureSession = async (
  accessToken: string, 
  refreshToken: string | null
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log("Configuration de la session avec le token d'accès");
    
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (sessionError) {
      console.error("Erreur lors de la configuration de la session:", sessionError);
      return { 
        success: false, 
        error: `Erreur d'authentification: ${sessionError.message}`
      };
    }
    
    console.log("Session configurée avec succès");
    return { success: true, error: null };
  } catch (err) {
    console.error("Exception lors de la configuration de session:", err);
    return { 
      success: false, 
      error: "Une erreur s'est produite lors de l'authentification. Veuillez réessayer."
    };
  }
};

/**
 * Vérifie si l'utilisateur a une session active
 */
export const checkExistingSession = async (): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return !!sessionData.session;
  } catch (err) {
    console.error("Erreur lors de la vérification de session existante:", err);
    return false;
  }
};
