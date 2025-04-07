
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction check-smtp-config appelée");
    
    // Créer un client Supabase avec la clé secrète
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // La fonction réelle devrait vérifier la configuration SMTP
    // Mais l'API Supabase ne permet pas actuellement d'accéder à ces paramètres
    // On retourne donc une réponse générique indiquant que nous ne pouvons pas vérifier
    // Pour une vraie vérification, il faudrait un test d'email

    // On peut seulement suggérer à l'utilisateur de vérifier manuellement
    const smtpEnabled = true; // On suppose que c'est activé
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        smtpEnabled,
        message: "La configuration SMTP ne peut pas être vérifiée automatiquement. Veuillez vérifier les paramètres dans l'interface Supabase." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
