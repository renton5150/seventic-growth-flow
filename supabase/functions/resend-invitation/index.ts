
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
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

    try {
      const { email, redirectUrl } = await req.json();
      console.log(`Traitement du renvoi d'invitation pour: ${email}`);
      console.log(`URL de redirection: ${redirectUrl}`);

      if (!email || typeof email !== 'string') {
        return new Response(JSON.stringify({ error: "Email invalide ou manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Recherche de l'utilisateur
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (userError) {
          console.error("Erreur lors de la recherche des utilisateurs:", userError);
          return new Response(JSON.stringify({ 
            error: `Erreur lors de la recherche des utilisateurs: ${userError.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const user = userData?.users?.find(u => u.email === email);
        
        if (!user) {
          console.error("Utilisateur non trouvé:", email);
          return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        console.log(`Utilisateur trouvé: ${user.id} (${user.email})`);

        // Utiliser directement la méthode pour envoyer le lien
        try {
          console.log("Envoi d'un lien de réinitialisation");
          
          const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery", 
            email: email, 
            options: {
              redirectTo: redirectUrl || `${new URL(req.url).origin}/reset-password?type=invite`
            }
          });
          
          if (resetError) {
            console.error("Erreur lors de l'envoi du lien:", resetError);
            return new Response(JSON.stringify({ 
              error: `Erreur lors de l'envoi du lien: ${resetError.message}` 
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          
          console.log("Lien de réinitialisation envoyé avec succès");
          return new Response(JSON.stringify({ 
            success: true,
            message: "Invitation renvoyée avec succès"
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("Erreur lors de l'envoi du lien:", err);
          return new Response(JSON.stringify({ 
            error: `Erreur lors de l'envoi du lien: ${err instanceof Error ? err.message : String(err)}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur:", error);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de la recherche de l'utilisateur: ${error instanceof Error ? error.message : String(error)}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la requête:", error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors du traitement de la requête: ${error instanceof Error ? error.message : String(error)}` 
      }), {
        status: 400,
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
