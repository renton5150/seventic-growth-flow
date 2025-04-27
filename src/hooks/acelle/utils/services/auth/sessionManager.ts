
import { supabase } from "@/integrations/supabase/client";

export const getSessionToken = async (): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData?.session?.access_token || null;
};

