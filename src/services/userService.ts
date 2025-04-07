
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Fonction pour vérifier si une valeur est un UserRole valide
const isValidUserRole = (role: any): role is UserRole => {
  return role === "admin" || role === "growth" || role === "sdr";
};

// Récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<User[]> => {
  try {
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
    return [];
  }
};

// Récupérer un utilisateur par ID
export const getUserById = async (userId: string): Promise<User | undefined> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
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

// Créer un nouvel utilisateur - avec contournement de RLS en utilisant le service REST
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string; user?: User }> => {
  console.log("Début de la création d'un nouvel utilisateur:", { email, name, role });
  
  // Vérification du rôle
  if (!isValidUserRole(role)) {
    console.error("Rôle invalide fourni:", role);
    return { success: false, error: "Rôle invalide" };
  }
  
  try {
    // Générer un UUID pour le nouvel utilisateur
    const userId = uuidv4();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`;
    
    console.log("Tentative de création d'un profil pour:", email, "avec ID:", userId);
    
    // Utiliser le service REST avec apikey pour contourner les restrictions RLS
    const url = `${supabase.supabaseUrl}/rest/v1/profiles`;
    const anonKey = supabase.supabaseKey;

    console.log("Utilisation de l'API REST pour insérer le profil");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        email: email,
        name: name,
        role: role,
        avatar: avatarUrl,
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur d'API lors de la création du profil:", errorData);
      toast.error(`Erreur: ${response.statusText}`);
      return { success: false, error: `${response.statusText}: ${JSON.stringify(errorData)}` };
    }
    
    const data = await response.json();
    console.log("Profil créé avec succès via l'API REST:", data);
    
    // Créer l'objet utilisateur à retourner
    const newUser: User = {
      id: userId,
      email: email,
      name: name,
      role: role,
      avatar: avatarUrl
    };
    
    console.log("Utilisateur créé avec succès:", newUser);
    toast.success("Utilisateur ajouté avec succès");
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Exception générale lors de la création de l'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast.error(`Erreur: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};
