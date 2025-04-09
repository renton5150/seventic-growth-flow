
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Utiliser les secrets que vous avez configurés
    const SUPABASE_URL = Deno.env.get("APPLICATION_INTERNE_SEVENTIC");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    console.log("URL Supabase:", SUPABASE_URL ? "Définie" : "Non définie");
    console.log("Clé de service:", SUPABASE_SERVICE_ROLE_KEY ? "Définie" : "Non définie");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Erreur: Variables d'environnement manquantes");
      return new Response(JSON.stringify({
        error: "Configuration du serveur incorrecte"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Créer un client Supabase avec le rôle de service
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer et valider le corps de la requête
    const requestBody = await req.json();
    console.log("Corps de la requête reçu:", JSON.stringify(requestBody));
    
    const { email, redirectUrl } = requestBody;
    
    console.log(`Traitement du renvoi d'invitation pour: ${email}`);
    console.log(`URL de redirection: ${redirectUrl}`);

    if (!email || typeof email !== 'string') {
      console.error("Email invalide ou manquant dans la requête");
      return new Response(JSON.stringify({ error: "Email invalide ou manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!redirectUrl || typeof redirectUrl !== 'string') {
      console.error("URL de redirection invalide ou manquante");
      return new Response(JSON.stringify({ error: "URL de redirection invalide ou manquante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      // Récupérer le profil pour obtenir le rôle actuel
      console.log("Recherche du profil pour l'email:", email);
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, name')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) {
        console.error("Erreur lors de la récupération du profil:", profileError);
        return new Response(JSON.stringify({
          error: `Erreur lors de la récupération du profil: ${profileError.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      if (!profile) {
        console.error("Aucun profil trouvé pour cet email:", email);
        return new Response(JSON.stringify({ 
          error: `Aucun profil trouvé pour l'email: ${email}` 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const role = profile.role || 'sdr';
      const name = profile.name || '';
      console.log("Nom utilisateur trouvé:", name);
      console.log("Rôle utilisateur trouvé:", role);
      
      // Vérifier si l'utilisateur existe déjà dans auth
      console.log("Vérification si l'utilisateur existe déjà dans auth");
      
      // Au lieu d'utiliser getUserByEmail (qui n'existe pas), utilisons une autre méthode
      // pour vérifier si l'utilisateur existe dans auth
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.listUsers({
        email: email
      });
      
      let userExists = false;
      if (authUserError) {
        console.error("Erreur lors de la vérification de l'existence de l'utilisateur:", authUserError);
      } else {
        userExists = authUser && authUser.users && authUser.users.length > 0;
        console.log("Utilisateur existant:", userExists ? "Oui" : "Non");
      }
      
      if (userExists) {
        console.log("Utilisateur existant, envoi d'un lien de réinitialisation");
        
        // Envoyer un lien de réinitialisation de mot de passe
        const resetResult = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (resetResult.error) {
          console.error("Erreur lors de l'envoi du lien de réinitialisation:", resetResult.error);
          return new Response(JSON.stringify({ 
            error: `Erreur lors de l'envoi du lien de réinitialisation: ${resetResult.error.message}`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        console.log("Email envoyé avec succès");
        return new Response(JSON.stringify({ 
          success: true,
          message: "Lien de réinitialisation envoyé avec succès",
          userExists: true
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        console.log("Nouvel utilisateur, envoi d'une invitation");
        
        // Envoyer une invitation pour un nouvel utilisateur
        const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
          data: {
            role: role,
            name: name
          }
        });
        
        if (inviteResult.error) {
          console.error("Erreur lors de l'envoi de l'invitation:", inviteResult.error);
          return new Response(JSON.stringify({ 
            error: `Erreur lors de l'envoi de l'invitation: ${inviteResult.error.message}`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        console.log("Email envoyé avec succès");
        return new Response(JSON.stringify({ 
          success: true,
          message: "Invitation envoyée avec succès",
          userExists: false
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (err) {
      console.error("Exception lors de l'envoi de l'email:", err);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'email: ${err instanceof Error ? err.message : String(err)}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Erreur générale:", error);
    return new Response(JSON.stringify({ 
      error: `Erreur générale: ${error instanceof Error ? error.message : String(error)}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
