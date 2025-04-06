
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = error.message === "Invalid login credentials" 
          ? "Identifiants invalides" 
          : error.message;
        
        console.error("Erreur de connexion:", errorMessage);
        toast.error("Échec de la connexion", { description: errorMessage });
        setAuthError(errorMessage);
        setLoading(false);
        return false;
      }

      if (!data.session) {
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
    } catch (error) {
      console.error("Exception lors de la connexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur de connexion", { description: errorMessage });
      setAuthError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        toast.error("Échec de la déconnexion");
        setLoading(false);
        return false;
      }

      console.log("Déconnexion réussie");
      toast.success("Déconnexion réussie");
      
      // Réinitialiser l'état
      setUser(null);
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      setLoading(false);
      return false;
    }
  };

  return { login, logout, authError };
};
