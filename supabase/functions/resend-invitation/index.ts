
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "./cors.ts";
import { validateRequest } from "./validation.ts";
import { getSupabaseAdmin } from "./supabase.ts";
import { checkSmtpConfiguration } from "./email-config.ts";
import { getUserProfile } from "./user-profile.ts";
import { sendResetLink, sendInvitationLink } from "./auth-email.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestBody = await req.json();
    console.log("Corps de la requête reçu:", JSON.stringify(requestBody));
    
    // Validate request
    const validationResult = validateRequest(requestBody);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: validationResult.status || 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const { email, redirectUrl, checkSmtpConfig = false } = requestBody;
    console.log(`Tentative d'envoi d'invitation à: ${email}`);
    console.log(`URL de redirection: ${redirectUrl}`);
    
    // Get Supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if ('error' in supabaseAdmin) {
      return new Response(JSON.stringify({ error: supabaseAdmin.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Check SMTP configuration if requested
    const emailConfig = checkSmtpConfig ? 
      await checkSmtpConfiguration(supabaseAdmin.client) : 
      { smtpConfigured: false, emailProvider: "Supabase default" };

    // Get user profile for role information
    const profileResult = await getUserProfile(supabaseAdmin.client, email);
    if ('error' in profileResult) {
      return new Response(JSON.stringify({ error: profileResult.error }), {
        status: profileResult.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check if user exists in auth
    console.log("Vérification si l'utilisateur existe déjà dans auth");
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.client.auth.admin.listUsers({
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
    console.log("Configuration email:", emailConfig.emailProvider, 
                emailConfig.smtpConfigured ? "(SMTP configuré)" : "(SMTP non configuré)");
    
    // Send appropriate email based on whether user exists
    if (userExists) {
      return await sendResetLink(
        supabaseAdmin.client, 
        email, 
        redirectUrl, 
        profileResult.profile, 
        emailConfig,
        corsHeaders
      );
    } else {
      return await sendInvitationLink(
        supabaseAdmin.client, 
        email, 
        redirectUrl, 
        profileResult.profile, 
        emailConfig,
        corsHeaders
      );
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
