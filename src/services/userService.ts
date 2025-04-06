
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { users as mockUsersImport } from "@/data/users";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Créer une copie locale des utilisateurs fictifs pour les modifications en mode démo
const mockUsers = [...mockUsersImport];

// Récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log("Tentative de récupération des utilisateurs...");
    
    // Vérifier la connexion Supabase
    const isSupabaseConnected = supabaseUrl !== "" && supabaseAnonKey !== "";
    
    // Mode démo si pas de connexion Supabase
    if (!isSupabaseConnected) {
      console.log("Mode démo activé : utilisation des données simulées pour les utilisateurs");
      console.log(`Nombre total d'utilisateurs dans mockUsers: ${mockUsers.length}`);
      // Retourner une copie des utilisateurs fictifs pour éviter les problèmes de référence
      return [...mockUsers];
    }

    // Mode production avec Supabase
    console.log("Mode production: récupération des utilisateurs depuis Supabase");
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast.error("Erreur lors de la récupération des utilisateurs");
      return [...mockUsers];
    }

    console.log(`${data.length} utilisateurs récupérés depuis Supabase`);
    return data.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email?.split('@')[0] || 'Utilisateur',
      role: user.role as UserRole || 'sdr',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=7E69AB&color=fff`
    }));
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des utilisateurs:", error);
    return [...mockUsers];
  }
};

// Récupérer un utilisateur par ID
export const getUserById = async (userId: string): Promise<User | undefined> => {
  try {
    // Vérifier la connexion Supabase
    const isSupabaseConnected = supabaseUrl !== "" && supabaseAnonKey !== "";
    
    if (!isSupabaseConnected) {
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
      role: data.role as UserRole,
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
): Promise<{ success: boolean; error?: string; user?: User }> => {
  console.log("Création d'un nouvel utilisateur:", { email, name, role });
  
  // Vérification supplémentaire pour s'assurer que le rôle est valide
  if (!isValidUserRole(role)) {
    console.error("Rôle invalide fourni:", role);
    return { success: false, error: "Rôle invalide" };
  }
  
  try {
    // Vérifier la connexion Supabase
    const isSupabaseConnected = supabaseUrl !== "" && supabaseAnonKey !== "";
    console.log("Supabase est connecté:", isSupabaseConnected);
    
    // Mode démo si pas de connexion Supabase
    if (!isSupabaseConnected) {
      console.log("Mode démo: simulation de création d'utilisateur");
      
      // Créer un nouvel utilisateur fictif avec ID unique
      const newUser: User = {
        id: uuidv4(),
        email,
        name,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`
      };
      
      // Ajouter l'utilisateur aux données simulées
      mockUsers.push(newUser);
      
      console.log("Utilisateur créé en mode démo:", newUser);
      console.log("Nombre total d'utilisateurs en mode démo:", mockUsers.length);
      return { success: true, user: newUser };
    }

    // Mode production avec Supabase
    console.log("Mode production: création d'utilisateur dans Supabase");
    
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
    const roleValue: UserRole = role; // Ré-affirme explicitement le type
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: roleValue })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Erreur lors de la mise à jour du profil:", profileError);
      // On ne renvoie pas d'erreur ici car l'utilisateur a bien été créé
      // Le rôle par défaut sera appliqué (sdr)
    }

    // Créer l'objet utilisateur à retourner
    const newUser: User = {
      id: authData.user.id,
      email: email,
      name: name,
      role: roleValue,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`
    };

    console.log("Utilisateur créé avec succès:", newUser);
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Exception lors de la création de l'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMessage };
  }
};

// Obtenir les variables Supabase pour les vérifications internes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
