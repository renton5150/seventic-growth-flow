
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

    // Utiliser un watchdog pour limiter la durée de la fonction
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
      console.warn("Timeout de la fonction - abandon du traitement");
    }, 6000); // Limiter à 6 secondes max

    try {
      const { email, redirectUrl } = await req.json();
      console.log(`Traitement du renvoi d'invitation pour: ${email}`);
      console.log(`URL de redirection: ${redirectUrl}`);

      if (!email || typeof email !== 'string') {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({ error: "Email invalide ou manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Vérifier si l'utilisateur existe (avec timeout)
      const userPromise = supabaseAdmin.auth.admin.listUsers({ 
        filter: { email: email }
      });
      
      // Utiliser Promise.race pour limiter le temps d'attente
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Délai dépassé pendant la recherche de l'utilisateur")), 3000);
      });
      
      const { data: userData, error: userError } = await Promise.race([
        userPromise,
        timeoutPromise
      ]).catch(err => {
        console.warn("Timeout lors de la recherche de l'utilisateur:", err);
        return { 
          data: { users: [] }, 
          error: { message: "Délai dépassé pendant la recherche de l'utilisateur" } 
        };
      });

      if (userError) {
        console.error("Erreur lors de la recherche de l'utilisateur:", userError);
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de la recherche de l'utilisateur: ${userError.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const users = userData?.users;
      if (!users || users.length === 0) {
        console.error("Utilisateur non trouvé:", email);
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const user = users[0];
      console.log(`Utilisateur trouvé: ${user.id} (${user.email})`);

      // Utiliser directement la méthode la plus fiable pour envoyer le lien
      try {
        console.log("Envoi d'un lien de réinitialisation");
        
        // Limiter le temps d'attente à 3 secondes
        const resetPromise = supabaseAdmin.auth.admin
          .generateLink({
            type: "recovery", 
            email: email, 
            options: {
              redirectTo: redirectUrl || `${new URL(req.url).origin}/reset-password?type=invite`
            }
          });
        
        const resetTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Délai dépassé pendant la génération du lien")), 3000);
        });
        
        // Utiliser race pour limiter le temps d'attente
        const { error: resetError } = await Promise.race([resetPromise, resetTimeoutPromise])
          .catch(err => {
            console.warn("Timeout lors de la génération du lien:", err);
            return { error: { message: err.message } };
          });
        
        if (resetError) {
          console.error("Erreur lors de l'envoi du lien:", resetError);
          clearTimeout(timeoutId);
          return new Response(JSON.stringify({ 
            error: `Erreur lors de l'envoi du lien: ${resetError.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        clearTimeout(timeoutId);
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
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de l'envoi du lien: ${err.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Erreur lors du traitement de la requête:", error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors du traitement de la requête: ${error.message}` 
      }), {
        status: 400,
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
