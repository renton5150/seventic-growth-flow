import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { users as mockUsers } from "@/data/users";
import { toast } from "sonner";

// Récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Vérifier si les variables d'environnement Supabase sont définies
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log("Mode démo activé : utilisation des données simulées pour les utilisateurs");
      return mockUsers;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return mockUsers;
    }

    return data.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email?.split('@')[0] || 'Utilisateur',
      role: user.role as UserRole || 'sdr',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=7E69AB&color=fff`
    }));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des utilisateurs:", error);
    return mockUsers;
  }
};

// Récupérer un utilisateur par ID
export const getUserById = async (userId: string): Promise<User | undefined> => {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // Mode démo
      return mockUsers.find(user => user.id === userId);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return mockUsers.find(user => user.id === userId);
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=7E69AB&color=fff`
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de l'utilisateur:", error);
    return mockUsers.find(user => user.id === userId);
  }
};

// Fonction pour vérifier si une valeur est un UserRole valide
const isValidUserRole = (role: any): role is UserRole => {
  return role === "admin" || role === "growth" || role === "sdr";
};

// Créer un nouvel utilisateur
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> => {
  console.log("Création d'un nouvel utilisateur:", { email, name, role });
  
  // Vérification supplémentaire pour s'assurer que le rôle est valide
  if (!isValidUserRole(role)) {
    console.error("Rôle invalide fourni:", role);
    return { success: false, error: "Rôle invalide" };
  }
  
  try {
    // Vérifier si on est en mode démo
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log("Mode démo: simulation de création d'utilisateur");
      return { success: true };
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!1";
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error("Erreur lors de la création de l'utilisateur dans Auth:", authError);
      return { success: false, error: authError.message };
    }

    // Vérifier que l'utilisateur a bien été créé
    if (!authData.user) {
      console.error("Utilisateur non créé dans Auth");
      return { success: false, error: "Erreur lors de la création de l'utilisateur" };
    }

    console.log("Utilisateur créé dans Auth:", authData.user.id);

    // Mettre à jour le profil avec le rôle choisi
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Erreur lors de la mise à jour du profil:", profileError);
      // On ne renvoie pas d'erreur ici car l'utilisateur a bien été créé
      // Le rôle par défaut sera appliqué (sdr)
    }

    // Envoyer un email d'invitation avec le mot de passe temporaire
    // Note: Dans un vrai projet, on utiliserait Supabase Auth pour envoyer un lien magique
    // ou une invitation par email, mais pour cet exemple on simule juste l'envoi

    console.log("Utilisateur créé avec succès:", { id: authData.user.id, email, name, role });
    return { success: true };
  } catch (error) {
    console.error("Exception lors de la création de l'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMessage };
  }
};
