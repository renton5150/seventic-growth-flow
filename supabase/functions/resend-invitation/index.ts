
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log("Request body received:", JSON.stringify(requestBody));
    
    // Validate request
    const validationResult = validateRequest(requestBody);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: validationResult.status || 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const { 
      email, 
      redirectUrl, 
      checkSmtpConfig = false, 
      debug = false, 
      inviteOptions = {},
      skipJwtVerification = true // Always skip JWT verification
    } = requestBody;
    
    console.log(`Attempting to send invitation to: ${email}`);
    console.log(`Redirect URL: ${redirectUrl}`);
    console.log(`Debug mode: ${debug ? "enabled" : "disabled"}`);
    console.log("Invitation options:", JSON.stringify(inviteOptions));
    
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
    console.log("Checking if user already exists in auth");
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.client.auth.admin.listUsers({
      filter: `email.eq.${email}`
    });
    
    if (authUsersError) {
      console.error("Error checking for user existence:", authUsersError);
      return new Response(JSON.stringify({ 
        error: `Error checking for user: ${authUsersError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const userExists = authUsers && authUsers.users && authUsers.users.length > 0;
    console.log("User exists:", userExists ? "Yes" : "No");
    console.log("Email configuration:", emailConfig.emailProvider, 
                emailConfig.smtpConfigured ? "(SMTP configured)" : "(SMTP not configured)");
    
    // Send appropriate email based on whether user exists
    if (userExists) {
      return await sendResetLink(
        supabaseAdmin.client, 
        email, 
        redirectUrl, 
        profileResult.profile, 
        emailConfig,
        corsHeaders,
        inviteOptions
      );
    } else {
      return await sendInvitationLink(
        supabaseAdmin.client, 
        email, 
        redirectUrl, 
        profileResult.profile, 
        emailConfig,
        corsHeaders,
        inviteOptions
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ 
      error: `General error: ${error instanceof Error ? error.message : String(error)}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
