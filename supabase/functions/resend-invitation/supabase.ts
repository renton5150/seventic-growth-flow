
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// Create and return a Supabase admin client
export async function getSupabaseAdmin() {
  const SUPABASE_URL = Deno.env.get("APPLICATION_INTERNE_SEVENTIC");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  console.log("URL Supabase:", SUPABASE_URL ? "Définie" : "Non définie");
  console.log("Clé de service:", SUPABASE_SERVICE_ROLE_KEY ? "Définie" : "Non définie");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Erreur: Variables d'environnement manquantes");
    return {
      error: "Configuration du serveur incorrecte"
    };
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return { client };
}
