
import { User, UserRole } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { isValidUserRole } from "./types";
import { CreateUserResponse } from "./types";

// Créer un nouvel utilisateur avec email et rôle seulement
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole
): Promise<CreateUserResponse> => {
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
