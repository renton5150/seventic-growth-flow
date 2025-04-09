
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
    console.log("Rôle utilisateur trouvé:", role);
    console.log("Nom utilisateur trouvé:", name);
    
    // Utiliser inviteUserByEmail pour renvoyer une invitation
    try {
      console.log("Envoi de l'invitation par email avec les données:", {
        email,
        redirectUrl,
        role
      });
      
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          role: role,
          name: name
        }
      });
      
      if (error) {
        console.error("Erreur lors de l'envoi de l'invitation:", error);
        return new Response(JSON.stringify({ 
          error: `Erreur lors de l'envoi de l'invitation: ${error.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log("Invitation envoyée avec succès:", data);
      return new Response(JSON.stringify({ 
        success: true,
        message: "Invitation renvoyée avec succès"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Exception lors de l'envoi de l'invitation:", err);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'invitation: ${err instanceof Error ? err.message : String(err)}` 
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
