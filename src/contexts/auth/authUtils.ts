
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
}

// Créer un profil utilisateur à partir des données Supabase
export const createUserProfile = async (user: SupabaseUser): Promise<User | null> => {
  try {
    console.log("Récupération du profil pour:", user.id);
    
    // Vérifier si l'utilisateur a déjà un profil
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log("Profil non trouvé, création d'un nouveau profil");
        
        // Création du profil avec rôle par défaut 'sdr'
        const newUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Nouvel utilisateur',
          role: 'sdr' as UserRole
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newUser);
          
        if (insertError) {
          console.error("Erreur lors de la création du profil:", insertError);
          return null;
        }
        
        // Retourner le nouvel utilisateur
        const appUser: User = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=7E69AB&color=fff`
        };
        
        console.log("Nouveau profil créé:", appUser);
        return appUser;
      }
      
      console.error("Erreur lors de la récupération du profil:", userError);
      return null;
    }
    
    // Utiliser les données existantes
    const appUser: User = {
      id: userData.id,
      email: userData.email || user.email || '',
      name: userData.name || 'Utilisateur',
      role: userData.role as UserRole || 'sdr',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=7E69AB&color=fff`
    };
    
    console.log("Profil existant chargé:", appUser);
    console.log("Rôle de l'utilisateur:", appUser.role);
    return appUser;
  } catch (error) {
    console.error("Exception lors du traitement du profil:", error);
    return null;
  }
};
