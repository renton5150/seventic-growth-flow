
// Check and return SMTP configuration status
export async function checkSmtpConfiguration(supabaseAdmin: any) {
  let smtpConfigured = false;
  let emailProvider = "Supabase default";
  
  try {
    // Obtenir les configurations d'email - nécessite des droits admin
    const { data: emailSettings, error: emailError } = await supabaseAdmin
      .from('supabase_functions')
      .select('*')
      .eq('name', 'email')
      .maybeSingle();
    
    console.log("Configuration email récupérée:", emailSettings ? "Oui" : "Non");
    
    if (emailSettings && !emailError) {
      smtpConfigured = emailSettings.config?.smtp?.enabled || false;
      emailProvider = smtpConfigured ? "SMTP personnalisé" : "Supabase default";
      console.log("SMTP configuré:", smtpConfigured);
    } else if (emailError) {
      console.error("Erreur lors de la récupération de la configuration email:", emailError);
    }
  } catch (err) {
    console.log("Impossible de récupérer la configuration SMTP:", err);
  }
  
  return { smtpConfigured, emailProvider };
}
