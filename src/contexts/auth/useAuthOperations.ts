
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";

export const useAuthOperations = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Fonction de connexion avec Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Tentative de connexion à Supabase avec:", email);
      
      // Connexion avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur de connexion:", error.message);
        toast.error("Erreur de connexion", {
          description: error.message
        });
        return false;
      }
      
      if (data.session) {
        console.log("Connexion réussie, session créée");
        // La session est déjà configurée par l'écouteur d'événement onAuthStateChange
        toast.success("Connexion réussie", {
          description: "Bienvenue sur Seventic Growth Flow",
        });
        return true;
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
      
      // Déconnexion avec Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        toast.error("Erreur de déconnexion", {
          description: error.message
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
    } finally {
      setLoading(false);
    }
  };

  return { login, logout };
};
