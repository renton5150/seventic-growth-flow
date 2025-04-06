
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
        setLoading(false);
        return false;
      }

      console.log("Envoi des identifiants à Supabase");
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
        setLoading(false);
        return false;
      }

      if (!data.session) {
        console.error("Pas de session après connexion réussie");
        toast.error("Erreur: Impossible d'établir une session");
        setAuthError("Impossible d'établir une session");
        setLoading(false);
        return false;
      }

      console.log("Connexion réussie, données de la session:", data.session.user.id);
      toast.success("Connexion réussie", { duration: 2000 });
      
      // Laisser l'écouteur d'authentification gérer le reste du processus
      // La session est maintenant active, l'écouteur dans useAuthSession va prendre le relai
      
      return true;
    } catch (error) {
      console.error("Exception lors de la connexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Exception: " + errorMessage);
      setAuthError(errorMessage);
      setLoading(false);
      return false;
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
        setLoading(false);
        return false;
      }

      console.log("Déconnexion réussie");
      toast.success("Déconnexion réussie");
      
      // Effacer les données utilisateur
      setUser(null);
      setLoading(false);
      
      return true;
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Exception: " + errorMessage);
      setLoading(false);
      return false;
    }
  };

  return { login, logout, authError };
};
