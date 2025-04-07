
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
    
    // Créer un client Supabase avec la clé secrète pour avoir des permissions admin
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Vérifier l'authentification de la requête
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Erreur d'authentification: token manquant ou invalide");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est autorisé (admin uniquement)
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Erreur d'authentification:", authError);
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est un admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return new Response(
        JSON.stringify({ error: "Impossible de vérifier les permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile || profile.role !== "admin") {
      console.error("Accès non autorisé pour l'utilisateur:", user.id);
      return new Response(
        JSON.stringify({ error: "Autorisé uniquement pour les administrateurs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les données de la requête
    const { email } = await req.json();
    if (!email) {
      console.error("Email manquant dans la requête");
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentative de renvoi d'invitation à: ${email}`);

    // Vérifier si l'utilisateur existe avant de tenter de renvoyer l'invitation
    const { data: userExists, error: userCheckError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userCheckError) {
      console.error("Erreur lors de la vérification de l'utilisateur:", userCheckError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userExists) {
      console.error("Utilisateur non trouvé:", email);
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'origine de la requête pour utiliser comme URL de redirection
    const origin = req.headers.get("origin") || "https://seventic-growth-flow.lovable.app";
    console.log("URL d'origine pour redirection:", origin);
    
    // URL explicite de redirection
    const redirectUrl = `${origin}/reset-password?type=signup`;
    console.log("URL de redirection configurée:", redirectUrl);

    // Envoyer l'email de réinitialisation
    const { data: emailData, error: emailError } = await supabaseAdmin.auth.admin.resetPasswordForEmail(
      email,
      { 
        redirectTo: redirectUrl 
      }
    );

    if (emailError) {
      console.error("Erreur lors de l'envoi du email:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Invitation renvoyée avec succès à ${email}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation renvoyée avec succès",
        data: { email } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue lors du renvoi de l'invitation:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
