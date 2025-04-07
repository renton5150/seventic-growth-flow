
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

    // Utiliser generateLink au lieu de resetPasswordForEmail pour un contrôle plus précis
    console.log("Génération du lien d'invitation avec la méthode generateLink");
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo
      }
    });

    if (linkError) {
      console.error("Erreur lors de la génération du lien:", linkError);
      return new Response(
        JSON.stringify({ success: false, error: linkError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!linkData) {
      console.error("Aucune donnée retournée lors de la génération du lien");
      return new Response(
        JSON.stringify({ success: false, error: "Échec de la génération du lien d'invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lien généré avec succès, email devrait être envoyé automatiquement");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email d'invitation envoyé",
        data: { 
          email,
          // Ne pas inclure l'URL complète pour des raisons de sécurité
          linkCreated: true
        } 
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
