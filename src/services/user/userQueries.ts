
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Cache pour éviter les requêtes redondantes sur courte durée
let userCache: { users: User[] | null; timestamp: number } = {
  users: null,
  timestamp: 0
};
const CACHE_TIMEOUT = 2000; // 2 secondes

// Récupérer tous les utilisateurs - version compatible avec TanStack Query
export const getAllUsers = async () => {
  return getAllUsersWithForceFresh();
};

// Version interne qui gère le forceRefresh
export const getAllUsersWithForceFresh = async (forceRefresh = false): Promise<User[]> => {
  try {
    // Vérifier si des données sont déjà en cache et si elles sont encore valides
    const now = Date.now();
    if (!forceRefresh && userCache.users && (now - userCache.timestamp < CACHE_TIMEOUT)) {
      console.log("Utilisation du cache pour les utilisateurs", userCache.users.length);
      return userCache.users;
    }
    
    console.log("Récupération des utilisateurs depuis Supabase");
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast.error("Erreur lors de la récupération des utilisateurs");
      return [];
    }

    if (!data) {
      return [];
    }

    const users = data.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email?.split('@')[0] || 'Utilisateur',
      role: user.role as UserRole || 'sdr',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=7E69AB&color=fff`
    }));

    // Mise en cache des données
    userCache = {
      users,
      timestamp: now
    };
    
    console.log(`${users.length} utilisateurs récupérés depuis Supabase`);
    return users;
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des utilisateurs:", error);
    return [];
  }
};

// Récupérer un utilisateur par ID
export const getUserById = async (userId: string): Promise<User | undefined> => {
  try {
    // Vérifier si l'utilisateur existe dans le cache en premier
    if (userCache.users) {
      const cachedUser = userCache.users.find(user => user.id === userId);
      if (cachedUser) {
        console.log("Utilisateur trouvé dans le cache:", userId);
        return cachedUser;
      }
    }
    
    console.log("Récupération de l'utilisateur depuis Supabase:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return undefined;
    }

    if (!data) {
      return undefined;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=7E69AB&color=fff`
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération de l'utilisateur:", error);
    return undefined;
  }
};

// Fonction d'invalidation du cache
export const invalidateUserCache = () => {
  console.log("Invalidation du cache utilisateur");
  userCache = { users: null, timestamp: 0 };
};
