
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
    console.log("Rôle spécifié pour le nouvel utilisateur:", role);
    
    // Récupérer l'origine pour l'URL de redirection
    const origin = window.location.origin;
    
    // S'assurer qu'on redirige explicitement vers la page reset-password avec le type et l'email
    const redirectTo = `${origin}/reset-password?type=invite&email=${encodeURIComponent(email)}`;
    console.log("URL de redirection pour la confirmation:", redirectTo);
    
    // Utiliser signUp pour créer un nouvel utilisateur avec le rôle spécifié dans les métadonnées
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
          role,
          created_at: new Date().toISOString()
        },
        emailRedirectTo: redirectTo,
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Créer ou mettre à jour manuellement le profil avec les informations complètes
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7E69AB&color=fff`;
    
    console.log("Mise à jour du profil avec le rôle:", role);
    
    // Utiliser une fonction plus robuste pour l'upsert avec retry
    const updateProfile = async (retries = 3): Promise<boolean> => {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            name: name,
            role: role,
            avatar: avatarUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (profileError) {
          console.error("Erreur lors de la mise à jour du profil (tentative):", profileError);
          
          if (retries > 0 && profileError.code === '23505') { // Code for duplicate key violation
            console.log(`Conflit détecté, nouvelle tentative dans 1s (${retries} restantes)`);
            await new Promise(r => setTimeout(r, 1000));
            return updateProfile(retries - 1);
          }
          
          return false;
        }
        
        return true;
      } catch (err) {
        console.error("Exception lors de la mise à jour du profil:", err);
        
        if (retries > 0) {
          console.log(`Exception, nouvelle tentative dans 1s (${retries} restantes)`);
          await new Promise(r => setTimeout(r, 1000));
          return updateProfile(retries - 1);
        }
        
        return false;
      }
    };
    
    const profileUpdateSuccess = await updateProfile();
    
    if (!profileUpdateSuccess) {
      console.warn("Avertissement: problème lors de la mise à jour du profil, mais l'utilisateur a été créé");
    }
    
    // Vérifier que le profil a bien été créé avec le bon rôle
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
      
    console.log("Vérification du rôle après création:", profileCheck?.role);
    
    // Après la création réussie, envoyer une invitation explicite
    try {
      console.log("Envoi de l'invitation explicite via resend-invitation...");
      const inviteParams = {
        email: email,
        redirectUrl: redirectTo,
        skipJwtVerification: true,
        inviteOptions: {
          expireIn: 15552000 // 180 days (6 months)
        }
      };
      
      // Appel explicite à la fonction edge pour s'assurer que l'email est envoyé
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke(
        'resend-invitation', 
        { body: inviteParams }
      );
      
      if (inviteError) {
        console.warn("Avertissement: L'invitation explicite supplémentaire a échoué, mais l'utilisateur a été créé:", inviteError);
      } else {
        console.log("Invitation supplémentaire envoyée avec succès:", inviteData);
      }
    } catch (inviteErr) {
      console.warn("Exception lors de l'envoi de l'invitation supplémentaire:", inviteErr);
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
