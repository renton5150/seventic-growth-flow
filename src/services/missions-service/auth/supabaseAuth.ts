
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a user is authenticated with Supabase
 */
export const isSupabaseAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking Supabase authentication:", error);
    return false;
  }
};
