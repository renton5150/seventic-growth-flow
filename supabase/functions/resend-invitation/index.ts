
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

    // Vérifier si l'utilisateur existe déjà
    const { data: userExists, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userCheckError && !userCheckError.message.includes('No rows found')) {
      console.error("Erreur lors de la vérification de l'utilisateur:", userCheckError);
      return new Response(
        JSON.stringify({ success: false, error: userCheckError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'origine de la requête pour utiliser comme URL de redirection
    const origin = req.headers.get("origin") || "https://seventic-growth-flow.lovable.app";
    console.log("URL d'origine pour redirection:", origin);
    
    // URL explicite de redirection avec type=invite pour signaler que c'est une invitation
    const redirectTo = `${origin}/reset-password?type=invite`;
    console.log("URL de redirection configurée:", redirectTo);

    // Si l'utilisateur existe, on utilise generateLink pour envoyer un lien de réinitialisation
    if (userExists) {
      console.log("Utilisateur existant trouvé:", userExists.email);
      console.log("Envoi de l'email de réinitialisation via generateLink");
      
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo
        }
      });

      if (error) {
        console.error("Erreur lors de la génération du lien:", error);
        // Journaliser les détails de l'erreur pour debug
        console.log("Détails complets de l'erreur:", JSON.stringify(error, null, 2));
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message,
            details: "Erreur lors de l'envoi de l'email. Vérifiez votre configuration SMTP dans Supabase."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Lien de réinitialisation généré avec succès:", data);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email de réinitialisation envoyé",
          data: { email } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // L'utilisateur n'existe pas, essayer de l'inviter
      console.log("L'utilisateur n'existe pas, tentative d'invitation");
      
      // Essayer d'abord avec inviteUserByEmail qui enverra un email d'invitation
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo
      });
      
      if (inviteError) {
        console.error("Erreur lors de l'invitation par email:", inviteError);
        console.log("Détails de l'erreur d'invitation:", JSON.stringify(inviteError, null, 2));
        
        // Si l'invitation échoue, retourner l'erreur
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: inviteError.message,
            details: "Erreur lors de l'envoi de l'invitation. Vérifiez les logs et la configuration SMTP."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Invitation envoyée avec succès:", inviteData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation envoyée",
          data: { email } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    
    // Journaliser l'erreur complète pour le debug
    try {
      console.log("Détails complets de l'erreur:", JSON.stringify(error, null, 2));
    } catch (e) {
      console.log("Impossible de serialiser l'erreur complète:", e);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        details: "Une erreur inattendue s'est produite. Vérifiez les logs de la fonction Edge dans Supabase."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
