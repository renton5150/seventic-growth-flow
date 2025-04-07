
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

    // MÉTHODE DIRECTE: Utiliser l'API REST native de Supabase Auth
    console.log("Envoi d'invitation via API REST directe");

    // Construction de l'URL complète de l'API
    const authApiUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/invite`;
    console.log("URL de l'API Auth utilisée:", authApiUrl);
        
    const inviteResponse = await fetch(authApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        email: email,
        data: { invited_at: new Date().toISOString() }
      }),
    });

    const responseBody = await inviteResponse.text();
    console.log(`Réponse de l'API (status ${inviteResponse.status}):`, responseBody);
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseBody);
    } catch (e) {
      jsonResponse = { raw: responseBody };
    }

    if (!inviteResponse.ok) {
      console.error("Erreur avec l'API d'invitation:", jsonResponse);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Échec de l'envoi d'invitation",
          details: jsonResponse,
          status: inviteResponse.status,
          statusText: inviteResponse.statusText
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Invitation envoyée avec succès via API REST:", jsonResponse);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email d'invitation envoyé",
        data: { email, method: "rest-api" } 
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
