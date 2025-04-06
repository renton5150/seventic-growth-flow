
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { AuthError } from "@supabase/supabase-js";

export const useAuthOperations = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Fonction de connexion avec Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Tentative de connexion à Supabase avec:", email);
      
      // Validation des entrées
      if (!email || !password) {
        console.error("Email ou mot de passe manquant");
        toast.error("Erreur de connexion", {
          description: "Veuillez fournir un email et un mot de passe"
        });
        setLoading(false);
        return false;
      }
      
      // Connexion avec Supabase avec un timeout de sécurité
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      const timeoutPromise = new Promise<{ data: null, error: AuthError }>((_, reject) => {
        setTimeout(() => reject(new Error("Délai de connexion dépassé")), 10000);
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise])
        .catch(err => {
          console.error("Erreur de connexion (timeout):", err.message);
          return { data: null, error: { message: "Délai de connexion dépassé. Veuillez réessayer." } as AuthError };
        });
      
      if ('error' in result && result.error) {
        console.error("Erreur de connexion:", result.error.message);
        
        // Messages d'erreur plus spécifiques
        if (result.error.message.includes("Invalid login credentials")) {
          toast.error("Identifiants invalides", {
            description: "Email ou mot de passe incorrect"
          });
        } else if (result.error.message.includes("Délai de connexion dépassé")) {
          toast.error("Erreur réseau", {
            description: "La connexion a pris trop de temps. Vérifiez votre connexion internet et réessayez."
          });
        } else {
          toast.error("Erreur de connexion", {
            description: result.error.message
          });
        }
        setLoading(false);
        return false;
      }
      
      if (result.data?.session) {
        console.log("Connexion réussie, utilisateur:", result.data.session.user.id);
        
        try {
          // Récupérer le profil utilisateur
          const userProfile = await createUserProfile(result.data.session.user);
          setUser(userProfile);
          
          toast.success("Connexion réussie", {
            description: "Bienvenue sur Seventic Growth Flow"
          });
          
          return true;
        } catch (profileError) {
          console.error("Erreur lors de la création du profil utilisateur:", profileError);
          toast.error("Erreur de profil", {
            description: "Impossible de charger votre profil"
          });
          return false;
        }
      } else {
        console.error("Connexion échouée: session non créée");
        toast.error("Erreur de connexion", {
          description: "Impossible d'établir une session"
        });
        return false;
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la connexion:", error);
      toast.error("Erreur de connexion", {
        description: "Une erreur technique est survenue"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion avec Supabase
  const logout = async () => {
    try {
      setLoading(true);
      console.log("Tentative de déconnexion...");
      
      // Déconnexion avec Supabase avec timeout
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<{ error: AuthError }>((_, reject) => {
        setTimeout(() => reject(new Error("Délai de déconnexion dépassé")), 5000);
      });
      
      const result = await Promise.race([logoutPromise, timeoutPromise])
        .catch(err => {
          console.warn("Erreur de déconnexion (timeout):", err.message);
          // Même en cas de timeout, on considère l'utilisateur déconnecté localement
          setUser(null);
          return { error: null };
        });
      
      if ('error' in result && result.error) {
        console.error("Erreur de déconnexion:", result.error.message);
        toast.error("Erreur de déconnexion", {
          description: result.error.message
        });
        return;
      }
      
      setUser(null);
      toast.success("Déconnexion réussie");
      console.log("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la déconnexion"
      });
      // Même en cas d'erreur, on déconnecte l'utilisateur localement
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { login, logout };
};
