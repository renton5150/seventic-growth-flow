
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
      console.log("Début de la procédure de déconnexion améliorée");
      setLoading(true);

      // Forcer immédiatement la déconnexion côté client
      setUser(null);

      // Nettoyer le localStorage en premier
      try {
        console.log("Nettoyage du localStorage...");
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        console.log("localStorage nettoyé");
      } catch (err) {
        console.warn("Erreur lors du nettoyage du localStorage:", err);
      }

      // Tenter la déconnexion Supabase avec gestion d'erreur robuste
      try {
        console.log("Tentative de déconnexion Supabase...");
        
        // Vérifier d'abord si une session existe
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log("Session trouvée, tentative de déconnexion globale");
          const { error } = await supabase.auth.signOut({ scope: 'global' });
          
          if (error) {
            console.warn("Erreur de déconnexion Supabase (ignorée):", error.message);
          } else {
            console.log("Déconnexion Supabase réussie");
          }
        } else {
          console.log("Aucune session active à déconnecter");
        }
      } catch (error) {
        console.warn("Exception lors de la déconnexion Supabase (ignorée):", error);
      }

      console.log("Déconnexion terminée avec succès");
      toast.success("Déconnexion réussie");
      setLoading(false);
      return true;

    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      
      // Forcer la déconnexion locale même en cas d'erreur
      setUser(null);
      
      // Nettoyer le localStorage de force
      try {
        localStorage.clear();
      } catch (err) {
        console.warn("Impossible de vider le localStorage:", err);
      }
      
      toast.success("Déconnexion locale effectuée");
      setLoading(false);
      return true; // Retourner true car la déconnexion locale a été effectuée
    }
  };

  return { login, logout, authError };
};
