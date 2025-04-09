
// Check and return SMTP configuration status
export async function checkSmtpConfiguration(supabaseAdmin: any) {
  let smtpConfigured = false;
  let emailProvider = "Supabase default";
  let smtpDetails = null;
  
  try {
    console.log("Tentative de vérification de la configuration SMTP");
    console.log("IMPORTANT: L'email d'expéditeur recommandé est laura.decoster@7tic.fr");
    
    // Essayer de faire une requête directe à la table de configuration de l'auth
    try {
      const { data: authSettings, error: authError } = await supabaseAdmin
        .from('auth.config')
        .select('*')
        .maybeSingle();
      
      if (authSettings && !authError) {
        console.log("Configuration auth récupérée directement");
        smtpConfigured = authSettings.smtp?.enabled || false;
        smtpDetails = authSettings.smtp;
        emailProvider = smtpConfigured ? "SMTP personnalisé (auth.config)" : "Supabase default";
        
        if (smtpConfigured && smtpDetails) {
          console.log("Configuration SMTP détectée:", {
            ...smtpDetails,
            senderRecommended: "laura.decoster@7tic.fr"
          });
          
          // Vérifier si l'adresse email de l'expéditeur est celle recommandée
          const senderEmail = smtpDetails.sender || "";
          if (senderEmail !== "laura.decoster@7tic.fr") {
            console.warn("⚠️ L'email d'expéditeur configuré n'est pas celui recommandé:", 
              senderEmail, "Il est recommandé d'utiliser laura.decoster@7tic.fr");
          }
        }
      } else if (authError) {
        console.log("Erreur lors de l'accès direct à auth.config:", authError.message);
      }
    } catch (directAuthError) {
      console.log("Exception lors de l'accès direct à auth.config:", directAuthError);
    }
    
    // Si la première méthode échoue, essayez une requête à la table des fonctions
    if (!smtpDetails) {
      try {
        const { data: emailSettings, error: emailError } = await supabaseAdmin
          .from('supabase_functions')
          .select('*')
          .eq('name', 'email')
          .maybeSingle();
        
        console.log("Tentative avec supabase_functions:", emailSettings ? "Succès" : "Échec");
        
        if (emailSettings && !emailError) {
          smtpConfigured = emailSettings.config?.smtp?.enabled || false;
          smtpDetails = emailSettings.config?.smtp;
          emailProvider = smtpConfigured ? "SMTP personnalisé (supabase_functions)" : "Supabase default";
          
          if (smtpConfigured && smtpDetails) {
            console.log("Configuration SMTP détectée dans supabase_functions:", {
              ...smtpDetails,
              senderRecommended: "laura.decoster@7tic.fr"
            });
            
            // Vérifier si l'adresse email de l'expéditeur est celle recommandée
            const senderEmail = smtpDetails.sender || "";
            if (senderEmail !== "laura.decoster@7tic.fr") {
              console.warn("⚠️ L'email d'expéditeur configuré n'est pas celui recommandé:", 
                senderEmail, "Il est recommandé d'utiliser laura.decoster@7tic.fr");
            }
          }
        } else if (emailError) {
          console.error("Erreur supabase_functions:", emailError.message);
        }
      } catch (funcError) {
        console.log("Exception lors de l'accès à supabase_functions:", funcError);
      }
    }
    
    // Dernière tentative : requête à la table générale des paramètres
    if (!smtpDetails) {
      try {
        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('settings')
          .select('*')
          .eq('category', 'email')
          .maybeSingle();
          
        if (settings && !settingsError) {
          console.log("Configuration email trouvée dans settings");
          smtpConfigured = settings.smtp_enabled || false;
          smtpDetails = {
            host: settings.smtp_host,
            port: settings.smtp_port,
            user: settings.smtp_user,
            secure: settings.smtp_secure,
            sender: settings.smtp_sender || ""
          };
          emailProvider = smtpConfigured ? "SMTP personnalisé (settings)" : "Supabase default";
          
          if (smtpConfigured) {
            console.log("Configuration SMTP détectée dans settings:", {
              ...smtpDetails,
              senderRecommended: "laura.decoster@7tic.fr"
            });
            
            // Vérifier si l'adresse email de l'expéditeur est celle recommandée
            const senderEmail = smtpDetails.sender || "";
            if (senderEmail !== "laura.decoster@7tic.fr") {
              console.warn("⚠️ L'email d'expéditeur configuré n'est pas celui recommandé:", 
                senderEmail, "Il est recommandé d'utiliser laura.decoster@7tic.fr");
            }
          }
        } else if (settingsError) {
          console.log("Erreur lors de l'accès à settings:", settingsError.message);
        }
      } catch (settingsError) {
        console.log("Exception lors de l'accès à settings:", settingsError);
      }
    }
    
    if (!smtpConfigured) {
      console.warn("⚠️ AUCUNE CONFIGURATION SMTP DÉTECTÉE. Les emails seront envoyés par le service par défaut de Supabase.");
      console.warn("⚠️ Il est fortement recommandé de configurer un serveur SMTP personnalisé avec laura.decoster@7tic.fr comme expéditeur.");
    }
    
    console.log("Résultat final de la vérification SMTP:", { 
      smtpConfigured, 
      emailProvider,
      smtpDetails: smtpDetails ? 
        { ...smtpDetails, senderRecommended: "laura.decoster@7tic.fr" } : 
        "Non disponible",
      recommendation: "Configurer SMTP avec laura.decoster@7tic.fr comme expéditeur"
    });
  } catch (err) {
    console.log("Exception globale lors de la récupération de la configuration SMTP:", err);
  }
  
  return { smtpConfigured, emailProvider, smtpDetails };
}
