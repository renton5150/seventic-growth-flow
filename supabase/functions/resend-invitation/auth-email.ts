
// Functions for sending auth emails
export async function sendResetLink(
  supabaseAdmin: any, 
  email: string, 
  redirectUrl: string, 
  profile: { role: string, name: string },
  emailConfig: { smtpConfigured: boolean, emailProvider: string, smtpDetails?: any },
  corsHeaders: Record<string, string>
) {
  console.log("Utilisateur existant, envoi d'un lien de réinitialisation");
  
  try {
    const emailSettings = {
      email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: profile.role,
          name: profile.name
        }
      }
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
      options: {
        redirectTo: redirectUrl,
        data: {
          role: profile.role,
          name: profile.name
        }
      }
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
    
    // Journaliser la réponse complète pour le débogage
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
      debug: {
        emailSettings,
        responseData: resetResult.data,
        smtpDetails: emailConfig.smtpDetails || "Non disponible"
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
  corsHeaders: Record<string, string>
) {
  console.log("Nouvel utilisateur, envoi d'une invitation");
  
  try {
    const emailSettings = {
      email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: profile.role,
          name: profile.name
        }
      }
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
    
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role: profile.role,
        name: profile.name
      }
    });
    
    if (inviteResult.error) {
      console.error("ERREUR lors de l'envoi de l'invitation:", inviteResult.error);
      console.error("Détails de l'erreur:", typeof inviteResult.error === 'object' ? JSON.stringify(inviteResult.error) : inviteResult.error);
      return new Response(JSON.stringify({ 
        error: `Erreur lors de l'envoi de l'invitation: ${inviteResult.error.message}`,
        details: inviteResult.error
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
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
      recommendedSenderEmail: "laura.decoster@7tic.fr",
      debug: {
        emailSettings,
        responseData: inviteResult.data,
        smtpDetails: emailConfig.smtpDetails || "Non disponible"
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
