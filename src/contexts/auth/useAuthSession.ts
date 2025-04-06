
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";

export const useAuthSession = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Configurer la gestion de session
  useEffect(() => {
    // Important: définir un délai maximum pour le chargement
    const timeoutId = setTimeout(() => {
      console.log("Délai maximum de chargement atteint, arrêt du chargement");
      setLoading(false);
    }, 5000); // 5 secondes maximum de chargement
    
    const checkSession = async () => {
      try {
        console.log("Vérification de session en cours...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          setLoading(false);
          return;
        }
        
        console.log("Résultat de la session:", session ? "Session trouvée" : "Aucune session");
        
        if (session) {
          const userProfile = await createUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Erreur inattendue lors de la vérification de session:", error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        console.log("Chargement terminé");
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
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setUser, setLoading]);
};
