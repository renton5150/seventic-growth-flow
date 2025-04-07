
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
    // Utilisation d'une URL absolue et complète
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

    // MÉTHODE 1: Envoi d'invitation via l'API directe de Supabase Auth
    try {
      console.log("Envoi d'invitation via admin.inviteUserByEmail");
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo,
        data: { 
          invited_at: new Date().toISOString(),
          is_invitation: true
        }
      });

      if (inviteError) {
        console.error("Erreur lors de l'envoi de l'invitation via inviteUserByEmail:", inviteError);
        
        // Si l'utilisateur existe déjà, essayer une approche alternative
        if (inviteError.message && inviteError.message.includes("already been registered")) {
          console.log("Utilisateur déjà enregistré, tentative avec méthode alternative...");
        } else {
          // C'est une autre erreur, retourner l'erreur
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Erreur lors de l'envoi de l'invitation: ${inviteError.message}`,
              details: inviteError
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Succès avec cette méthode
        console.log("Invitation envoyée avec succès via admin.inviteUserByEmail:", inviteData);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email d'invitation envoyé via admin.inviteUserByEmail",
            data: inviteData
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      console.error("Exception lors de l'envoi de l'invitation via inviteUserByEmail:", error);
      // Continuer avec la méthode alternative
    }

    // MÉTHODE 2: Réinitialisation de mot de passe en tant qu'alternative
    console.log("Tentative avec méthode alternative: réinitialisation de mot de passe");
    try {
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: redirectTo
        }
      });

      if (resetError) {
        console.error("Erreur lors de la tentative de réinitialisation de mot de passe:", resetError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erreur lors de la génération du lien de réinitialisation: ${resetError.message}`,
            details: resetError
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Lien de réinitialisation généré avec succès:", resetData);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email de réinitialisation envoyé comme alternative à l'invitation",
          data: { 
            email,
            method: "password-reset",
            user_id: userId
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Exception lors de la génération du lien de réinitialisation:", error);
    }

    // MÉTHODE 3: Dernière méthode - appel direct à l'API REST
    console.log("Tentative avec API REST directe");

    // Construction de l'URL de l'API
    const authApiUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/recover`;
    console.log("URL de l'API Auth utilisée:", authApiUrl);
        
    const recoverResponse = await fetch(authApiUrl, {
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
    });

    const responseBody = await recoverResponse.text();
    console.log(`Réponse de l'API de récupération (status ${recoverResponse.status}):`, responseBody);
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseBody);
    } catch (e) {
      jsonResponse = { raw: responseBody };
    }

    if (!recoverResponse.ok) {
      console.error("Erreur avec l'API de récupération:", jsonResponse);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Échec des trois méthodes d'envoi d'invitation",
          details: jsonResponse,
          status: recoverResponse.status,
          statusText: recoverResponse.statusText
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Email de récupération envoyé avec succès via API REST:", jsonResponse);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de récupération envoyé comme alternative",
        data: { email, method: "rest-api-recover" } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erreur serveur",
        message: errorMessage,
        stack: errorStack
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
