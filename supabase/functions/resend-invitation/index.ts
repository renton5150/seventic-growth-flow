
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

    const { email, redirectUrl } = await req.json();
    console.log(`Traitement du renvoi d'invitation pour: ${email}`);
    console.log(`URL de redirection: ${redirectUrl}`);

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
      // Essayer plusieurs méthodes pour envoyer l'invitation
      let success = false;
      let errorMessages = [];
      
      // Méthode 1: Lien de réinitialisation (recovery)
      try {
        console.log("Tentative d'envoi d'une invitation (méthode 1: lien de réinitialisation)");
        
        const { data: passwordResetData, error: passwordResetError } = await supabaseAdmin.auth.admin
          .generateLink({
            type: "recovery", 
            email: email, 
            options: {
              redirectTo: redirectUrl || `${new URL(req.url).origin}/reset-password?type=invite`
            }
          });
        
        if (passwordResetError) {
          console.error("Erreur méthode 1:", passwordResetError);
          errorMessages.push(`Méthode 1 (recovery): ${passwordResetError.message}`);
        } else {
          console.log("Lien de réinitialisation généré avec succès");
          success = true;
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Invitation renvoyée avec succès (méthode recovery)"
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (err) {
        console.error("Exception méthode 1:", err);
        errorMessages.push(`Exception méthode 1: ${err.message}`);
      }
      
      // Méthode 2: Invitation directe
      if (!success) {
        try {
          console.log("Tentative d'envoi d'une invitation (méthode 2: invitation magique)");
          
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin
            .inviteUserByEmail(email, {
              redirectTo: redirectUrl || `${new URL(req.url).origin}/reset-password?type=invite`
            });
          
          if (inviteError) {
            console.error("Erreur méthode 2:", inviteError);
            errorMessages.push(`Méthode 2 (invite): ${inviteError.message}`);
          } else {
            console.log("Invitation envoyée avec succès");
            success = true;
            
            return new Response(JSON.stringify({ 
              success: true,
              message: "Invitation renvoyée avec succès (méthode directe)"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (err) {
          console.error("Exception méthode 2:", err);
          errorMessages.push(`Exception méthode 2: ${err.message}`);
        }
      }
      
      // Méthode 3: Lien magique OTP
      if (!success) {
        try {
          console.log("Tentative d'envoi d'un lien de connexion (méthode 3: OTP)");
          
          const { data: signInData, error: signInError } = await supabase.auth
            .signInWithOtp({
              email: email,
              options: {
                emailRedirectTo: redirectUrl || `${new URL(req.url).origin}/reset-password?type=invite`
              }
            });
          
          if (signInError) {
            console.error("Erreur méthode 3:", signInError);
            errorMessages.push(`Méthode 3 (OTP): ${signInError.message}`);
          } else {
            console.log("Lien de connexion OTP envoyé avec succès");
            success = true;
            
            return new Response(JSON.stringify({ 
              success: true,
              message: "Un lien de connexion a été envoyé à l'utilisateur"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (err) {
          console.error("Exception méthode 3:", err);
          errorMessages.push(`Exception méthode 3: ${err.message}`);
        }
      }
      
      // Si aucune méthode n'a fonctionné
      if (!success) {
        console.error("Toutes les méthodes ont échoué:", errorMessages);
        return new Response(JSON.stringify({ 
          error: "Impossible d'envoyer l'invitation après plusieurs tentatives", 
          details: errorMessages.join("; ") 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
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
