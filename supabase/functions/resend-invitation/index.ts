
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
    
    const role = profile?.role || 'sdr';
    const name = profile?.name || '';
    console.log("Nom utilisateur trouvé:", name);
    console.log("Rôle utilisateur trouvé:", role);
    
    try {
      // Vérifier d'abord si l'utilisateur existe dans la table auth.users
      const { data: users, error: usersError } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      if (usersError) {
        console.error("Erreur lors de la vérification de l'utilisateur:", usersError);
        // On continue avec l'invitation car l'erreur peut être une restriction d'accès à auth.users
      }
      
      // Alternative: vérifier si l'email existe déjà via la méthode signInWithOtp
      const { data: otpCheck, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (otpError && !otpError.message.includes('User not found')) {
        console.error("Erreur lors de la vérification via OTP:", otpError);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de la vérification de l'utilisateur: ${otpError.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Si le lien a été généré avec succès, l'utilisateur existe
      const userExists = !!otpCheck;
      
      console.log(`Utilisateur existant: ${userExists ? 'Oui' : 'Non'}`);
      
      let result;
      
      if (userExists) {
        // Si l'utilisateur existe déjà, on utilise resetPasswordForEmail (via generateLink)
        console.log("Utilisateur existant détecté, envoi d'un email de réinitialisation du mot de passe");
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: redirectUrl
          }
        });
      } else {
        // Sinon on utilise inviteUserByEmail
        console.log("Nouvel utilisateur, envoi d'une invitation par email");
        result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
          data: {
            role: role,
            name: name
          }
        });
      }
      
      if (result.error) {
        console.error("Erreur lors de l'envoi du lien:", result.error);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de l'envoi du lien: ${result.error.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log("Email envoyé avec succès");
      return new Response(JSON.stringify({ 
        success: true,
        message: "Email envoyé avec succès"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
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
