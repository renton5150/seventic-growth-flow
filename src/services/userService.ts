
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

    if (!data) {
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

// Créer un nouvel utilisateur avec email et rôle seulement
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
    // Générer un mot de passe aléatoire temporaire pour l'utilisateur
    const tempPassword = uuidv4().substring(0, 12) + "!Aa1";
    
    console.log("Création de l'utilisateur dans Supabase Auth...");
    
    // Utiliser signUp pour créer un nouvel utilisateur
    // C'est la méthode recommandée car elle fonctionne avec les clés anon
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
          role
        },
        // Ajouter l'URL de redirection pour la confirmation d'email
        emailRedirectTo: `${window.location.origin}/reset-password?type=signup`,
      }
    });

    if (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      let errorMsg = error.message;
      
      if (error.message.includes("not allowed")) {
        errorMsg = "Domaine email non autorisé ou configuration Supabase incorrecte";
      }
      
      toast.error("Erreur: " + errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!data.user) {
      console.error("Utilisateur non créé");
      return { success: false, error: "Échec de la création de l'utilisateur" };
    }

    console.log("Utilisateur créé avec succès dans auth.users:", data.user.id);
    
    // Attendre un court instant pour s'assurer que le trigger a eu le temps de s'exécuter
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Créer ou mettre à jour manuellement le profil avec les informations complètes
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`;
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        avatar: avatarUrl
      }, { onConflict: 'id' });
    
    if (profileError) {
      console.error("Erreur lors de la mise à jour du profil:", profileError);
      toast.error("Profil créé mais erreur lors de la mise à jour des détails");
    }
    
    // Créer l'objet utilisateur à retourner
    const newUser: User = {
      id: data.user.id,
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

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Utiliser Promise.race avec setTimeout pour implémenter un timeout
    const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: false, 
          error: "La requête a pris trop de temps. Veuillez rafraîchir la page pour vérifier si l'utilisateur a été supprimé." 
        });
      }, 30000); // 30 secondes de timeout
    });
    
    // Appeler la fonction Edge
    const functionPromise = new Promise<{ success: boolean; error?: string }>(async (resolve) => {
      try {
        const { error: authError } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        
        if (authError) {
          console.error("Erreur lors de la suppression de l'utilisateur de auth.users:", authError);
          resolve({ success: false, error: authError.message });
        } else {
          console.log("Utilisateur supprimé avec succès:", userId);
          resolve({ success: true });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Exception lors de la suppression de l'utilisateur:", error);
        resolve({ success: false, error: errorMessage });
      }
    });
    
    // Utiliser Promise.race pour implémenter le timeout
    return await Promise.race([functionPromise, timeoutPromise]);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors de la suppression de l'utilisateur:", error);
    
    return { success: false, error: errorMessage };
  }
};

// Renvoyer une invitation
export const resendInvitation = async (email: string): Promise<{ success: boolean; error?: string }> => {
  console.log("Tentative de renvoi d'invitation à:", email);
  
  try {
    // Utiliser Promise.race avec setTimeout pour implémenter un timeout
    const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: false, 
          error: "La requête a pris trop de temps. Veuillez rafraîchir la page pour vérifier votre boîte mail." 
        });
      }, 30000); // 30 secondes de timeout
    });
    
    // Appeler la fonction Edge
    const functionPromise = new Promise<{ success: boolean; error?: string }>(async (resolve) => {
      try {
        const { error } = await supabase.functions.invoke('resend-invitation', {
          body: { email }
        });
        
        if (error) {
          console.error("Erreur lors du renvoi de l'invitation:", error);
          resolve({ success: false, error: error.message });
        } else {
          console.log("Invitation renvoyée avec succès à:", email);
          resolve({ success: true });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Exception lors du renvoi de l'invitation:", error);
        resolve({ success: false, error: errorMessage });
      }
    });
    
    // Utiliser Promise.race pour implémenter le timeout
    return await Promise.race([functionPromise, timeoutPromise]);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    
    return { success: false, error: errorMessage };
  }
};
