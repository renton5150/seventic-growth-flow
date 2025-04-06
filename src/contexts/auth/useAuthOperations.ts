
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erreur de connexion:", error.message);
        toast.error("Échec de la connexion: " + error.message);
        setAuthError(error.message);
        return false;
      }

      console.log("Connexion réussie, redirection vers le tableau de bord");
      toast.success("Connexion réussie");
      
      // La session est automatiquement traitée par useAuthSession
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
      
      // Effacer les données utilisateur (redondant avec l'événement onAuthStateChange mais garantit la cohérence)
      setUser(null);
      
      // Rediriger vers la page de connexion sera géré par le composant ProtectedRoute
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
