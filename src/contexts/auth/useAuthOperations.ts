
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
      console.log("Tentative de connexion pour:", email);
      setLoading(true);
      setAuthError(null);

      // Vérification des entrées
      if (!email || !password) {
        console.error("Email ou mot de passe manquant");
        setAuthError("Veuillez saisir un email et un mot de passe");
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erreur de connexion:", error.message);
        toast.error("Échec de la connexion: " + (
          error.message === "Invalid login credentials" 
            ? "Identifiants invalides" 
            : error.message
        ));
        setAuthError(error.message);
        return false;
      }

      if (!data.session) {
        console.error("Pas de session après connexion réussie");
        toast.error("Erreur: Impossible d'établir une session");
        setAuthError("Impossible d'établir une session");
        return false;
      }

      console.log("Connexion réussie, données de la session:", data);
      toast.success("Connexion réussie");
      
      return true;
    } catch (error) {
      console.error("Exception lors de la connexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Exception: " + errorMessage);
      setAuthError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Tentative de déconnexion");
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        toast.error("Échec de la déconnexion: " + error.message);
        return false;
      }

      console.log("Déconnexion réussie");
      toast.success("Déconnexion réussie");
      
      // Effacer les données utilisateur
      setUser(null);
      
      return true;
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Exception: " + errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, logout, authError };
};
