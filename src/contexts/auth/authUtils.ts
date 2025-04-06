
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
}

// Créer un profil utilisateur à partir des données Supabase
export const createUserProfile = async (user: SupabaseUser): Promise<User | null> => {
  try {
    console.log("Récupération du profil pour:", user.id);
    
    // Protection contre les erreurs de données
    if (!user || !user.id) {
      console.error("Données utilisateur invalides");
      return null;
    }
    
    // Vérifier si l'utilisateur a déjà un profil
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (userError) {
      console.error("Erreur lors de la récupération du profil:", userError);
      toast.error("Erreur de profil utilisateur");
      return null;
    }
    
    if (!userData) {
      console.log("Profil non trouvé, création d'un nouveau profil");
      
      // Determine role based on email
      let role: UserRole = 'sdr'; // Default role
      const email = user.email?.toLowerCase() || '';
      
      if (email === "gironde@seventic.com") {
        role = 'admin';
      } else if (email.includes('growth') || email === "growth@seventic.com") {
        role = 'growth';
      } else {
        // All other emails get SDR role
        role = 'sdr';
      }
      
      console.log(`Création d'un profil avec le rôle: ${role} pour l'email: ${email}`);
      
      const newUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Nouvel utilisateur',
        role
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newUser);
        
      if (insertError) {
        console.error("Erreur lors de la création du profil:", insertError);
        toast.error("Erreur de création de profil");
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
    toast.error("Erreur lors du chargement du profil");
    return null;
  }
};
