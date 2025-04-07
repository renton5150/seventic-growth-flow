
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
    console.log("Vérification de l'existence de l'utilisateur:", email);
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      filter: { email: email }
    });

    if (authError) {
      console.error("Erreur lors de la vérification dans auth.users:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erreur lors de la vérification de l'utilisateur",
          details: authError 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authUsers || authUsers.users.length === 0) {
      console.error("Utilisateur non trouvé dans auth.users");
      return new Response(
        JSON.stringify({ success: false, error: "Utilisateur introuvable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Utiliser la méthode plus fiable pour envoyer une invitation/réinitialisation
    console.log("Envoi d'une invitation à:", email);
    
    try {
      // Utilisation de l'API directe de Supabase Auth pour plus de fiabilité
      const inviteResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users/${authUsers.users[0].id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            email: email,
            redirect_to: redirectTo,
          }),
        }
      );

      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        console.error("Erreur lors de l'invitation:", errorData);
        
        // Vérifier si c'est une erreur liée à SMTP
        if (errorData.message?.includes("SMTP") || 
            errorData.message?.includes("email") || 
            errorData.message?.includes("mail") ||
            errorData.error?.includes("SMTP") || 
            errorData.error?.includes("email") || 
            errorData.error?.includes("mail")) {
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Problème avec la configuration SMTP",
              details: errorData,
              message: "Vérifiez vos paramètres d'email dans Supabase Authentication > SMTP settings." 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Erreur lors de l'envoi de l'invitation",
            details: errorData 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Invitation envoyée avec succès à:", email);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email d'invitation envoyé",
          data: { email } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (inviteError) {
      console.error("Exception lors de l'envoi de l'invitation:", inviteError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erreur serveur lors de l'envoi de l'invitation",
          details: inviteError instanceof Error ? inviteError.message : String(inviteError)
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
