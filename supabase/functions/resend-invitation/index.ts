
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
    console.log("Fonction resend-invitation appelée");
    
    // Créer un client Supabase avec la clé secrète
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Récupérer les données de la requête
    const { email } = await req.json();
    console.log(`Tentative de renvoi d'invitation à: ${email}`);

    if (!email) {
      console.error("Email manquant dans la requête");
      return new Response(
        JSON.stringify({ success: false, error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'origine de la requête pour utiliser comme URL de redirection
    const origin = req.headers.get("origin") || "https://seventic-growth-flow.lovable.app";
    console.log("URL d'origine pour redirection:", origin);
    
    // URL explicite de redirection
    const redirectTo = `${origin}/reset-password?type=signup`;
    console.log("URL de redirection configurée:", redirectTo);

    // Utiliser resetPasswordForEmail qui est plus simple et fonctionne avec SMTP
    console.log("Envoi de l'email de réinitialisation à:", email);
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    if (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email de réinitialisation envoyé avec succès");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé",
        data: { email } 
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
