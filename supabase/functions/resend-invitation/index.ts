
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Erreur: Variables d'environnement manquantes");
      return new Response(JSON.stringify({
        error: "Configuration du serveur incorrecte"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Créer un client Supabase avec le rôle de service pour des opérations administratives
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || "");

    const { email } = await req.json();
    console.log(`Traitement du renvoi d'invitation pour: ${email}`);

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: "Email invalide ou manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Vérifier si l'utilisateur existe
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin
      .listUsers({ 
        filter: {
          email: email
        }
      });

    if (userError) {
      console.error("Erreur lors de la recherche de l'utilisateur:", userError);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de la recherche de l'utilisateur: ${userError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const users = userData.users;
    if (!users || users.length === 0) {
      console.error("Utilisateur non trouvé:", email);
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const user = users[0];
    console.log(`Utilisateur trouvé: ${user.id} (${user.email})`);

    try {
      console.log("Tentative d'envoi d'une invitation (méthode 1: lien de réinitialisation)");
      // Utiliser le flux de réinitialisation de mot de passe pour un nouvel utilisateur
      const redirectTo = `${new URL(req.url).origin}/reset-password?type=invite`;
      
      const { data: passwordResetData, error: passwordResetError } = await supabaseAdmin.auth.admin
        .generateLink({
          type: "recovery", 
          email: email, 
          options: {
            redirectTo: redirectTo
          }
        });
      
      if (passwordResetError) {
        console.error("Erreur lors de la génération du lien de réinitialisation:", passwordResetError);
      } else {
        console.log("Lien de réinitialisation généré avec succès");
        return new Response(JSON.stringify({ 
          success: true,
          message: "Invitation renvoyée avec succès"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Si la première méthode échoue, essayer la méthode alternative
      console.log("Tentative d'envoi d'une invitation (méthode 2: invitation magique)");
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin
        .inviteUserByEmail(email, {
          redirectTo: redirectTo
        });
      
      if (inviteError) {
        console.error("Erreur lors de l'envoi de l'invitation:", inviteError);
        
        // Si les deux méthodes échouent, générer un lien de connexion
        console.log("Tentative d'envoi d'un lien de connexion (méthode 3)");
        const { data: signInData, error: signInError } = await supabase.auth
          .signInWithOtp({
            email: email,
            options: {
              emailRedirectTo: redirectTo
            }
          });
        
        if (signInError) {
          console.error("Toutes les méthodes ont échoué. Dernière erreur:", signInError);
          return new Response(JSON.stringify({ 
            error: "Impossible d'envoyer l'invitation. Erreur du serveur de messagerie." 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        console.log("Lien de connexion OTP envoyé avec succès");
        return new Response(JSON.stringify({ 
          success: true,
          message: "Un lien de connexion a été envoyé à l'utilisateur"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log("Invitation envoyée avec succès");
      return new Response(JSON.stringify({ 
        success: true,
        message: "Invitation renvoyée avec succès"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'invitation: ${error.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
  } catch (error) {
    console.error("Erreur générale:", error);
    return new Response(JSON.stringify({ error: `Erreur générale: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
