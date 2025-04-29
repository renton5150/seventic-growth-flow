
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si un utilisateur est authentifié avec Supabase
 */
export const isSupabaseAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification Supabase:", error);
    return false;
  }
};
