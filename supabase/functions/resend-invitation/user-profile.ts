
/**
 * Fonction pour récupérer le profil utilisateur par email
 */
export async function getUserProfile(supabaseClient, email) {
  console.log(`Recherche du profil pour l'email: ${email}`);

  try {
    // Vérifier si l'email ressemble à un UUID (erreur fréquente)
    if (email.includes('-') && email.length > 30) {
      console.warn(`ATTENTION: La valeur ${email} ressemble à un UUID et non à un email valide.`);
      return {
        error: `La valeur fournie (${email}) n'est pas un email valide mais ressemble à un ID utilisateur.`,
        status: 400
      };
    }

    // Rechercher le profil par email
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error("Erreur lors de la recherche du profil:", error);
      return { 
        error: `Erreur lors de la recherche du profil: ${error.message}`, 
        status: 500 
      };
    }

    if (!profiles || profiles.length === 0) {
      console.log(`Aucun profil trouvé pour l'email: ${email}`);
      // Au lieu de renvoyer une erreur, créer un profil par défaut pour l'invitation
      return { 
        profile: { 
          role: 'sdr', // Rôle par défaut
          name: email.split('@')[0] // Nom par défaut basé sur l'email
        } 
      };
    }

    console.log(`Profil trouvé pour ${email}:`, profiles[0]);
    return { profile: profiles[0] };
  } catch (error) {
    console.error("Exception lors de la recherche du profil:", error);
    return { 
      error: `Exception lors de la recherche du profil: ${error.message}`, 
      status: 500 
    };
  }
}
