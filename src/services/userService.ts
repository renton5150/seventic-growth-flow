
import { User } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { users as mockUsers } from "@/data/users";

// Récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Vérifier si les variables d'environnement Supabase sont définies
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log("Mode démo activé : utilisation des données simulées pour les utilisateurs");
      return mockUsers;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return mockUsers;
    }

    return data.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7E69AB&color=fff`
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
      .from('users')
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
