
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          data: authError 
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

    // Récupérer l'ID de l'utilisateur
    const userId = authUsers.users[0].id;
    console.log("ID utilisateur trouvé:", userId);

    try {
      // MÉTHODE 1: Utiliser admin.inviteUserByEmail qui est la méthode officielle recommandée
      console.log("Envoi d'invitation via admin.inviteUserByEmail");
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo,
        data: {
          invited_at: new Date().toISOString()
        }
      });

      if (inviteError) {
        console.error("Erreur lors de l'envoi de l'invitation via inviteUserByEmail:", inviteError);
        
        // Essayer la méthode alternative si la première échoue
        console.log("Tentative avec méthode alternative...");
        
        // MÉTHODE 2: Appel direct à l'API Auth de Supabase (méthode alternative)
        const inviteResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users/${userId}/invite`,
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
          console.error("Erreur avec méthode alternative:", errorData);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Échec de l'envoi d'invitation",
              data: errorData
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const responseData = await inviteResponse.json();
        console.log("Réponse de la méthode alternative:", responseData);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email d'invitation envoyé par méthode alternative",
            data: { email, method: "direct-api" } 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Invitation envoyée avec succès via inviteUserByEmail:", inviteData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email d'invitation envoyé",
          data: { email, method: "official-api" } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (inviteError) {
      console.error("Exception lors de l'envoi de l'invitation:", inviteError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erreur serveur lors de l'envoi de l'invitation",
          data: inviteError instanceof Error ? inviteError.message : String(inviteError)
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
        data: error instanceof Error ? error.message : String(error)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
