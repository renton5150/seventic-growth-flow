
// Get user profile information
export async function getUserProfile(supabaseAdmin: any, email: string) {
  console.log("Recherche du profil pour l'email:", email);
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, name')
    .eq('email', email)
    .maybeSingle();
  
  if (profileError) {
    console.error("Erreur lors de la récupération du profil:", profileError);
    return {
      error: `Erreur lors de la récupération du profil: ${profileError.message}`,
      status: 500
    };
  }
  
  if (!profile) {
    console.error("Aucun profil trouvé pour cet email:", email);
    return { 
      error: `Aucun profil trouvé pour l'email: ${email}`,
      status: 404
    };
  }
  
  const role = profile.role || 'sdr';
  const name = profile.name || '';
  console.log("Nom utilisateur trouvé:", name);
  console.log("Rôle utilisateur trouvé:", role);
  
  return { profile: { role, name } };
}
