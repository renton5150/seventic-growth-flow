
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
    // Utiliser l'URL de production Lovable pour les redirections
    const callbackRedirectUrl = `https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery&email=${encodeURIComponent(email)}`;
    
    console.log("URL de redirection pour reset:", callbackRedirectUrl);
    
    const options: any = {
      emailRedirectTo: callbackRedirectUrl,
      data: {
        role: profile.role,
        name: profile.name
      }
    };
    
    options.expireIn = inviteOptions.expireIn || 15552000; // 180 jours par défaut
    console.log(`Durée d'expiration configurée pour le lien: ${options.expireIn} secondes (${options.expireIn / 86400} jours)`);
    
    const emailSettings = {
      email,
      options
    };
    
    console.log("Informations pour le lien de réinitialisation:", JSON.stringify(emailSettings));
    
    // Log détaillé de la configuration email pour debugging
    if (emailConfig.smtpConfigured) {
      console.log("✓ Configuration SMTP validée avec laura.decoster@7tic.fr comme expéditeur");
    } else {
      console.error("⚠️ ALERTE: Envoi via Supabase par défaut car le SMTP n'est pas correctement configuré avec laura.decoster@7tic.fr");
    }
    
    console.log("Configuration email complète:", {
      provider: emailConfig.emailProvider,
      configured: emailConfig.smtpConfigured,
      details: emailConfig.smtpDetails || "Non disponible",
      exigence: "laura.decoster@7tic.fr DOIT être l'expéditeur"
    });
    
    const resetResult = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options
    });
    
    if (resetResult.error) {
      console.error("ERREUR lors de l'envoi du lien de réinitialisation:", resetResult.error);
      console.error("Détails de l'erreur:", typeof resetResult.error === 'object' ? JSON.stringify(resetResult.error) : resetResult.error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi du lien de réinitialisation: ${resetResult.error.message}`,
        details: resetResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Réponse complète de l'API de réinitialisation:", JSON.stringify(resetResult));
    console.log("Email de réinitialisation envoyé avec succès");
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Lien de réinitialisation envoyé avec succès",
      userExists: true,
      actionUrl: resetResult.data?.properties?.action_link || null,
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
      recommendedSenderEmail: "laura.decoster@7tic.fr",
      expireInDays: options.expireIn / 86400,
      debug: {
        emailSettings: { email, options },
        responseData: resetResult.data,
        smtpDetails: emailConfig.smtpDetails || "Non disponible",
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
    // Utiliser l'URL de production Lovable pour les redirections
    const callbackRedirectUrl = `https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=invite&email=${encodeURIComponent(email)}`;
    
    console.log("URL de redirection pour invitation:", callbackRedirectUrl);
    
    const options: any = {
      emailRedirectTo: callbackRedirectUrl,
      data: {
        role: profile.role,
        name: profile.name,
        // Template personnalisé pour l'email
        email_subject: "Inscription application Lovable Seventic",
        email_body: `Bonjour,

Nous vous invitons à vous connecter et créer votre mot de passe pour accéder à l'application Lovable Seventic.

Merci de mettre un mot de passe complexe.

Cdt,

The Seventic Team`
      }
    };
    
    options.expireIn = inviteOptions.expireIn || 15552000; // 180 jours par défaut
    console.log(`Durée d'expiration configurée pour l'invitation: ${options.expireIn} secondes (${options.expireIn / 86400} jours)`);
    
    const emailSettings = {
      email,
      options
    };
    
    console.log("Informations pour l'invitation:", JSON.stringify(emailSettings));
    
    // Log détaillé de la configuration email pour debugging
    if (emailConfig.smtpConfigured) {
      console.log("✓ Configuration SMTP validée avec laura.decoster@7tic.fr comme expéditeur");
    } else {
      console.error("⚠️ ALERTE: Envoi via Supabase par défaut car le SMTP n'est pas correctement configuré avec laura.decoster@7tic.fr");
    }
    
    console.log("Configuration email complète:", {
      provider: emailConfig.emailProvider,
      configured: emailConfig.smtpConfigured,
      details: emailConfig.smtpDetails || "Non disponible",
      exigence: "laura.decoster@7tic.fr DOIT être l'expéditeur"
    });
    
    // Tentative d'invitation avec retry en cas d'échec
    let inviteResult;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Tentative d'invitation ${attempts + 1}/${maxAttempts}`);
        inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, options);
        
        if (!inviteResult.error) {
          break;
        }
        
        console.error(`Échec de la tentative ${attempts + 1}:`, inviteResult.error);
        attempts++;
        
        if (attempts < maxAttempts) {
          const waitTime = 1000 * Math.pow(2, attempts);
          console.log(`Nouvelle tentative dans ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (err) {
        console.error(`Exception à la tentative ${attempts + 1}:`, err);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
      }
    }
    
    if (inviteResult?.error) {
      console.error("ERREUR lors de l'envoi de l'invitation après plusieurs tentatives:", inviteResult.error);
      console.error("Détails de l'erreur:", typeof inviteResult.error === 'object' ? JSON.stringify(inviteResult.error) : inviteResult.error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'invitation: ${inviteResult.error.message}`,
        details: inviteResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Réponse complète de l'API d'invitation:", JSON.stringify(inviteResult));
    console.log("Invitation envoyée avec succès");
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Invitation envoyée avec succès",
      userExists: false,
      actionUrl: inviteResult?.data?.properties?.action_link || null,
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
      recommendedSenderEmail: "laura.decoster@7tic.fr",
      expireInDays: options.expireIn / 86400,
      debug: {
        emailSettings: { email, options },
        responseData: inviteResult?.data,
        smtpDetails: emailConfig.smtpDetails || "Non disponible",
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
