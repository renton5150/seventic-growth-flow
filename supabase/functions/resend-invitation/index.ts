
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
    // Get environment variables
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

    // Create Supabase client with admin privileges
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate request body
    const requestBody = await req.json();
    console.log("Corps de la requête reçu:", JSON.stringify(requestBody));
    
    const { email, redirectUrl, checkSmtpConfig = false } = requestBody;
    
    console.log(`Tentative d'envoi d'invitation à: ${email}`);
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

    // Vérification de la configuration SMTP si demandé
    let smtpConfigured = false;
    let emailProvider = "Supabase default";
    
    if (checkSmtpConfig) {
      try {
        // Obtenir les configurations d'email - nécessite des droits admin
        const { data: emailSettings, error: emailError } = await supabaseAdmin
          .from('supabase_functions')
          .select('*')
          .eq('name', 'email')
          .maybeSingle();
        
        console.log("Configuration email récupérée:", emailSettings ? "Oui" : "Non");
        
        if (emailSettings && !emailError) {
          smtpConfigured = emailSettings.config?.smtp?.enabled || false;
          emailProvider = smtpConfigured ? "SMTP personnalisé" : "Supabase default";
          console.log("SMTP configuré:", smtpConfigured);
        } else if (emailError) {
          console.error("Erreur lors de la récupération de la configuration email:", emailError);
        }
      } catch (err) {
        console.log("Impossible de récupérer la configuration SMTP:", err);
      }
    }

    try {
      // Get user profile for role information
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

      // Check if user exists in auth
      console.log("Vérification si l'utilisateur existe déjà dans auth");
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${email}`
      });
      
      if (authUsersError) {
        console.error("Erreur lors de la vérification de l'existence de l'utilisateur:", authUsersError);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de la vérification de l'utilisateur: ${authUsersError.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const userExists = authUsers && authUsers.users && authUsers.users.length > 0;
      console.log("Utilisateur existant:", userExists ? "Oui" : "Non");
      console.log("Configuration email:", emailProvider, smtpConfigured ? "(SMTP configuré)" : "(SMTP non configuré)");
      
      // Force direct SMTP mode for debug
      const emailSettings = {
        email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: role,
            name: name
          }
        }
      };

      // Send appropriate email based on whether user exists
      if (userExists) {
        console.log("Utilisateur existant, envoi d'un lien de réinitialisation");
        
        try {
          console.log("Informations pour le lien de réinitialisation:", JSON.stringify(emailSettings));
          
          const resetResult = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
              redirectTo: redirectUrl,
              data: {
                role: role,
                name: name
              }
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
          
          // Journaliser la réponse complète pour le débogage
          console.log("Réponse complète de l'API de réinitialisation:", JSON.stringify(resetResult));
          console.log("Email de réinitialisation envoyé avec succès");
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Lien de réinitialisation envoyé avec succès",
            userExists: true,
            actionUrl: resetResult.data?.properties?.action_link || null,
            emailProvider,
            smtpConfigured,
            debug: {
              emailSettings,
              responseData: resetResult.data
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error("Exception lors de l'envoi du lien de réinitialisation:", error);
          return new Response(JSON.stringify({ 
            error: `Exception lors de l'envoi du lien de réinitialisation: ${error instanceof Error ? error.message : String(error)}`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } else {
        console.log("Nouvel utilisateur, envoi d'une invitation");
        
        try {
          console.log("Informations pour l'invitation:", JSON.stringify(emailSettings));
          
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
          
          // Journaliser la réponse complète pour le débogage
          console.log("Réponse complète de l'API d'invitation:", JSON.stringify(inviteResult));
          console.log("Invitation envoyée avec succès");
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Invitation envoyée avec succès",
            userExists: false,
            actionUrl: inviteResult.data?.properties?.action_link || null,
            emailProvider,
            smtpConfigured,
            debug: {
              emailSettings,
              responseData: inviteResult.data
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error("Exception lors de l'envoi de l'invitation:", error);
          return new Response(JSON.stringify({ 
            error: `Exception lors de l'envoi de l'invitation: ${error instanceof Error ? error.message : String(error)}`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
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
