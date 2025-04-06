
import { User, UserRole } from "@/types/types";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";
import { users as mockUsersImport } from "@/data/users";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Créer une copie locale des utilisateurs fictifs pour les modifications en mode démo
const mockUsers = [...mockUsersImport];

// Vérifier la connexion Supabase
const isSupabaseConnected = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
console.log("Supabase est connecté:", isSupabaseConnected ? "Oui" : "Non (mode démo)");

// Récupérer tous les utilisateurs
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log("Tentative de récupération des utilisateurs...");
    
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
    console.log("Supabase est connecté:", isSupabaseConnected ? "Oui" : "Non (mode démo)");
    
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
      
      // Simuler un délai de réseau pour que l'UI ait le temps de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true, user: newUser };
    }

    // Mode production avec Supabase
    console.log("Mode production: création d'utilisateur dans Supabase");
    
    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!1";
    
    console.log("Tentative de création d'utilisateur avec l'email:", email);
    
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name },
      });

      if (authError) {
        console.error("Erreur lors de la création de l'utilisateur dans Auth:", authError);
        toast.error(`Erreur: ${authError.message}`);
        return { success: false, error: authError.message };
      }

      // Vérifier que l'utilisateur a bien été créé
      if (!authData.user) {
        console.error("Utilisateur non créé dans Auth");
        toast.error("Erreur lors de la création de l'utilisateur");
        return { success: false, error: "Erreur lors de la création de l'utilisateur" };
      }

      console.log("Utilisateur créé dans Auth:", authData.user.id);

      // Mettre à jour le profil avec le rôle choisi
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: role })
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
        role: role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`
      };

      console.log("Utilisateur créé avec succès:", newUser);
      toast.success("Utilisateur créé avec succès");
      return { success: true, user: newUser };
    } catch (supaError) {
      console.error("Exception Supabase lors de la création de l'utilisateur:", supaError);
      toast.error(`Erreur Supabase: ${supaError instanceof Error ? supaError.message : "Erreur inconnue"}`);
      
      // En cas d'erreur d'authentification, essayer de créer directement dans la table profiles
      console.log("Tentative de création directe dans la table profiles...");
      try {
        const userId = uuidv4();
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: name,
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`
          });
          
        if (error) {
          console.error("Erreur lors de la création directe dans profiles:", error);
          toast.error(`Erreur: ${error.message}`);
          return { success: false, error: error.message };
        }
        
        const newUser: User = {
          id: userId,
          email: email,
          name: name,
          role: role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`
        };
        
        console.log("Utilisateur créé avec succès dans profiles:", newUser);
        toast.success("Utilisateur créé avec succès");
        return { success: true, user: newUser };
      } catch (directInsertError) {
        console.error("Exception lors de la création directe:", directInsertError);
        toast.error(`Erreur: ${directInsertError instanceof Error ? directInsertError.message : "Erreur inconnue"}`);
        return { success: false, error: directInsertError instanceof Error ? directInsertError.message : "Erreur inconnue" };
      }
    }
  } catch (error) {
    console.error("Exception générale lors de la création de l'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    toast.error(`Erreur: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};
