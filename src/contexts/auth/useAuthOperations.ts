
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@/types/types";

export const useAuthOperations = (
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void
) => {
  // État local pour suivre les erreurs d'authentification
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthError(null);

      // Vérification des entrées
      if (!email || !password) {
        setAuthError("Veuillez saisir un email et un mot de passe");
        setLoading(false);
        return false;
      }

      console.log("Tentative de connexion pour:", email);
      
      // Créer un contrôleur d'abandon pour gérer le timeout
      const controller = new AbortController();
      const { signal } = controller;
      
      // Configurer un timeout de 10 secondes
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          let errorMessage = "";
          if (error.message === "Invalid login credentials") {
            errorMessage = "Identifiants invalides";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Veuillez confirmer votre email avant de vous connecter";
          } else {
            errorMessage = error.message;
          }
          
          console.error("Erreur de connexion:", errorMessage);
          toast.error("Échec de la connexion", { description: errorMessage });
          setAuthError(errorMessage);
          setLoading(false);
          return false;
        }

        if (!data?.session) {
          console.error("Session non créée");
          toast.error("Erreur: Session non créée");
          setAuthError("Impossible d'établir une session");
          setLoading(false);
          return false;
        }

        console.log("Connexion réussie:", data.session.user.id);
        toast.success("Connexion réussie");
        
        // L'écouteur d'authentification se charge du reste
        return true;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err; // Relancer pour le gestionnaire externe
      }
    } catch (error) {
      console.error("Exception lors de la connexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (errorMessage.includes("aborted")) {
        toast.error("La connexion a pris trop de temps", { 
          description: "Le serveur ne répond pas. Veuillez réessayer plus tard."
        });
      } else {
        toast.error("Erreur de connexion", { description: errorMessage });
      }
      
      setAuthError(errorMessage);
      setLoading(false);
      return false;
    } finally {
      // S'assurer que loading est mis à false après une tentative
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const logout = async () => {
    try {
      console.log("Début de la procédure de déconnexion");
      setLoading(true);

      // Vérifier d'abord si une session existe
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log("Pas de session active à déconnecter");
        // Réinitialiser l'état utilisateur même sans session
        setUser(null);
        setLoading(false);
        return true;
      }

      console.log("Session active trouvée, tentative de déconnexion");

      // Gestion du timeout pour la déconnexion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn("Déconnexion interrompue après 5 secondes d'attente");
      }, 5000);
      
      try {
        const { error } = await supabase.auth.signOut();
        
        clearTimeout(timeoutId);

        if (error) {
          console.error("Erreur de déconnexion:", error.message);
          toast.error("Échec de la déconnexion", { description: error.message });
          
          // Réinitialiser l'état utilisateur même en cas d'erreur pour garantir la déconnexion côté client
          setUser(null);
          setLoading(false);
          return false;
        }

        console.log("Déconnexion réussie");
        
        // Réinitialiser l'état immédiatement pour une meilleure expérience utilisateur
        setUser(null);
        setLoading(false);
        return true;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      
      // Forcer la déconnexion locale même en cas d'erreur
      setUser(null);
      
      // Nettoyer le localStorage pour s'assurer que l'ancienne session est supprimée
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-dupguifqyjchlmzbadav-auth-token');
      
      setLoading(false);
      return true; // Retourner true pour indiquer que la déconnexion locale a été effectuée
    }
  };

  return { login, logout, authError };
};
