
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
    
    // URL explicite de redirection avec type=invite pour signaler que c'est une invitation
    const redirectTo = `${origin}/reset-password?type=invite`;
    console.log("URL de redirection configurée:", redirectTo);

    // Vérifier si l'utilisateur existe
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") { // PGRST116 = not found
      console.error("Erreur lors de la vérification de l'utilisateur:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la vérification de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si on ne trouve pas l'utilisateur dans les profils, vérifier dans auth.users
    if (!userData) {
      console.log("Utilisateur non trouvé dans les profils, vérification dans auth.users");
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        filter: { email: email }
      });

      if (authError) {
        console.error("Erreur lors de la vérification dans auth.users:", authError);
        return new Response(
          JSON.stringify({ success: false, error: "Utilisateur introuvable" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!authUsers || authUsers.users.length === 0) {
        console.error("Utilisateur non trouvé dans auth.users");
        return new Response(
          JSON.stringify({ success: false, error: "Utilisateur introuvable" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Vérifier la configuration SMTP
    console.log("Vérification de la configuration SMTP...");
    const { data: smtpData, error: smtpError } = await supabaseAdmin.functions.invoke('check-smtp-config', {});

    if (smtpError) {
      console.error("Erreur lors de la vérification de la configuration SMTP:", smtpError);
      return new Response(
        JSON.stringify({ success: false, error: "Impossible de vérifier la configuration SMTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (smtpData && !smtpData.smtpEnabled) {
      console.error("La configuration SMTP n'est pas activée");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "La configuration SMTP n'est pas activée. Veuillez configurer SMTP dans les paramètres d'authentification de Supabase." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Utiliser directement signInWithOtp pour envoyer un email magiclink (plus fiable)
    console.log("Envoi d'un magic link d'invitation avec signInWithOtp");
    const { error: otpError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo
    });

    if (otpError) {
      console.error("Erreur lors de l'envoi du magic link:", otpError);
      
      // Message d'erreur spécifique pour les problèmes SMTP courants
      if (otpError.message?.includes("SMTP") || 
          otpError.message?.includes("email") || 
          otpError.message?.includes("mail")) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Problème avec la configuration SMTP. Vérifiez vos paramètres d'email dans Supabase." 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: otpError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Magic link d'invitation envoyé avec succès");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email d'invitation envoyé",
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
