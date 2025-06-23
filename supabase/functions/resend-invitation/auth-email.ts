
// Functions for sending auth emails
export async function sendResetLink(
  supabaseAdmin: any, 
  email: string, 
  redirectUrl: string, 
  profile: { role: string, name: string },
  emailConfig: { smtpConfigured: boolean, emailProvider: string, smtpDetails?: any },
  corsHeaders: Record<string, string>,
  inviteOptions: Record<string, any> = {}
) {
  console.log("Utilisateur existant, envoi d'un lien de réinitialisation");
  
  try {
    // UTILISER L'URL FOURNIE DIRECTEMENT - déjà unifiée depuis le frontend
    const callbackRedirectUrl = redirectUrl;
    
    console.log("URL de redirection pour reset (unifiée):", callbackRedirectUrl);
    
    const options: any = {
      emailRedirectTo: callbackRedirectUrl,
      data: {
        role: profile.role,
        name: profile.name,
        email: email
      }
    };
    
    // Durée d'expiration longue (7 jours)
    options.expireIn = 604800; // 7 jours
    console.log(`Durée d'expiration configurée pour le lien: ${options.expireIn} secondes (${options.expireIn / 86400} jours)`);
    
    console.log("Informations pour le lien de réinitialisation:", JSON.stringify({ email, options }));
    console.log("Envoi du lien de réinitialisation via Supabase...");
    
    const resetResult = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options
    });
    
    if (resetResult.error) {
      console.error("ERREUR lors de l'envoi du lien de réinitialisation:", resetResult.error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi du lien de réinitialisation: ${resetResult.error.message}`,
        details: resetResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Email de réinitialisation envoyé avec succès via", emailConfig.emailProvider);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Lien de réinitialisation envoyé avec succès",
      userExists: true,
      actionUrl: resetResult.data?.properties?.action_link || null,
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
      expireInDays: options.expireIn / 86400,
      debug: {
        emailSettings: { email, options },
        responseData: resetResult.data,
        finalRedirectUrl: callbackRedirectUrl
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Exception lors de l'envoi du lien de réinitialisation:", error);
    return new Response(JSON.stringify({ 
      error: `Exception lors de l'envoi du lien de réinitialisation: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export async function sendInvitationLink(
  supabaseAdmin: any, 
  email: string, 
  redirectUrl: string, 
  profile: { role: string, name: string },
  emailConfig: { smtpConfigured: boolean, emailProvider: string, smtpDetails?: any },
  corsHeaders: Record<string, string>,
  inviteOptions: Record<string, any> = {}
) {
  console.log("Nouvel utilisateur, envoi d'une invitation");
  
  try {
    // UTILISER L'URL FOURNIE DIRECTEMENT - déjà unifiée depuis le frontend
    const callbackRedirectUrl = redirectUrl;
    
    console.log("URL de redirection pour invitation (unifiée):", callbackRedirectUrl);
    
    const options: any = {
      emailRedirectTo: callbackRedirectUrl,
      data: {
        role: profile.role,
        name: profile.name,
        email: email
      }
    };
    
    // Durée d'expiration longue (7 jours)
    options.expireIn = 604800; // 7 jours
    console.log(`Durée d'expiration configurée pour l'invitation: ${options.expireIn} secondes (${options.expireIn / 86400} jours)`);
    
    console.log("Informations pour l'invitation:", JSON.stringify({ email, options }));
    console.log("Envoi de l'invitation via Supabase...");
    
    // Tentative d'invitation
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, options);
    
    if (inviteResult?.error) {
      console.error("ERREUR lors de l'envoi de l'invitation:", inviteResult.error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'invitation: ${inviteResult.error.message}`,
        details: inviteResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Invitation envoyée avec succès via", emailConfig.emailProvider);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Invitation envoyée avec succès",
      userExists: false,
      actionUrl: inviteResult?.data?.properties?.action_link || null,
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
      expireInDays: options.expireIn / 86400,
      debug: {
        emailSettings: { email, options },
        responseData: inviteResult?.data,
        finalRedirectUrl: callbackRedirectUrl
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Exception lors de l'envoi de l'invitation:", error);
    return new Response(JSON.stringify({ 
      error: `Exception lors de l'envoi de l'invitation: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
