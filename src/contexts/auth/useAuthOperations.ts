
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
        // La session est déjà configurée par l'écouteur d'événement onAuthStateChange
        toast.success("Connexion réussie", {
          description: "Bienvenue sur Seventic Growth Flow",
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erreur inattendue lors de la connexion:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion avec Supabase
  const logout = async () => {
    try {
      setLoading(true);
      
      // Déconnexion avec Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        return;
      }
      
      setUser(null);
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error);
    } finally {
      setLoading(false);
    }
  };

  return { login, logout };
};
