
// Functions for sending auth emails
export async function sendResetLink(
  supabaseAdmin: any, 
  email: string, 
  redirectUrl: string, 
  profile: { role: string, name: string },
  emailConfig: { smtpConfigured: boolean, emailProvider: string },
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
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
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
}

export async function sendInvitationLink(
  supabaseAdmin: any, 
  email: string, 
  redirectUrl: string, 
  profile: { role: string, name: string },
  emailConfig: { smtpConfigured: boolean, emailProvider: string },
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
    
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role: profile.role,
        name: profile.name
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
      emailProvider: emailConfig.emailProvider,
      smtpConfigured: emailConfig.smtpConfigured,
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
