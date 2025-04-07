
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
    console.log("Fonction check-smtp-config appelée");
    
    // Créer un client Supabase avec la clé secrète
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Test SMTP configuration via a simple API call qui n'affectera pas l'utilisateur
    // On utilise un appel à l'API Auth Settings qui devrait échouer si SMTP n'est pas configuré
    try {
      // On tente de récupérer l'état actuel de la configuration SMTP
      const smtpTest = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/auth/v1/settings`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        }
      );

      const smtpStatus = await smtpTest.json();
      console.log("Statut SMTP récupéré:", smtpStatus);
      
      // Vérifier si SMTP est configuré en analysant la réponse
      const smtpEnabled = smtpStatus?.smtp?.enabled === true;
      const smtpConfigured = !!smtpStatus?.smtp?.host && 
                            !!smtpStatus?.smtp?.port && 
                            !!smtpStatus?.smtp?.sender_email;

      if (smtpEnabled && smtpConfigured) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            smtpEnabled: true,
            smtpConfigured: true,
            message: "La configuration SMTP semble correcte." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            smtpEnabled: smtpEnabled,
            smtpConfigured: smtpConfigured,
            message: "La configuration SMTP n'est pas complète dans Supabase. Veuillez vérifier les paramètres SMTP dans Authentication > SMTP." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
    } catch (smtpError) {
      console.error("Erreur lors du test SMTP:", smtpError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          smtpEnabled: false,
          error: "Impossible de vérifier la configuration SMTP: " + (smtpError instanceof Error ? smtpError.message : String(smtpError)),
          message: "Veuillez configurer SMTP dans les paramètres d'authentification de Supabase."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        message: "Une erreur s'est produite lors de la vérification SMTP."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
