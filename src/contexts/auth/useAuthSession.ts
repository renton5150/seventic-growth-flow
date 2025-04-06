
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";

export const useAuthSession = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Configurer la gestion de session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          setLoading(false);
          return;
        }
        
        if (session) {
          const userProfile = await createUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Configurer l'écouteur de changement d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event, session ? "session active" : "pas de session");
        
        if (event === 'SIGNED_IN' && session) {
          const userProfile = await createUserProfile(session.user);
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          setUser(null);
        }
      }
    );
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setUser, setLoading]);
};
