
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) {
    console.log("Vérification du rôle impossible: utilisateur non défini");
    return false;
  }
  
  console.log(`Vérification si l'utilisateur ${user.email} a le rôle ${role}. Rôle actuel: ${user.role}`);
  return user.role === role;
}

// Créer un profil utilisateur à partir des données Supabase
export const createUserProfile = async (user: SupabaseUser): Promise<User | null> => {
  try {
    console.log("Récupération du profil pour l'utilisateur:", user.id);
    
    // Vérifier si l'utilisateur a déjà un profil
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (userError) {
      console.error("Impossible de récupérer les données utilisateur:", userError);
      return null;
    }
    
    if (!userData) {
      // L'utilisateur n'a pas encore de profil, on en crée un
      console.log("Création d'un nouveau profil utilisateur pour:", user.id);
      
      // Création du profil avec rôle par défaut 'sdr'
      const newUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata.name || user.email?.split('@')[0] || 'Nouvel utilisateur',
        role: 'sdr' as UserRole
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newUser);
        
      if (insertError) {
        console.error("Impossible de créer le profil utilisateur:", insertError);
        return null;
      }
      
      // Adapter les données utilisateur au format attendu par l'application
      const appUser: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=7E69AB&color=fff`
      };
      
      console.log("Nouveau profil utilisateur créé:", appUser);
      return appUser;
    } else {
      // Adapter les données utilisateur au format attendu par l'application
      const appUser: User = {
        id: userData.id,
        email: userData.email || user.email || '',
        name: userData.name || 'Utilisateur',
        role: userData.role as UserRole || 'sdr',
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=7E69AB&color=fff`
      };
      
      console.log("Profil utilisateur existant chargé:", appUser);
      console.log("Rôle de l'utilisateur:", appUser.role);
      return appUser;
    }
  } catch (error) {
    console.error("Erreur lors du traitement du profil:", error);
    return null;
  }
};
