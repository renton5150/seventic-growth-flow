
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { toast } from "sonner";

export const useAuthSession = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Mise en place de la gestion de session
  useEffect(() => {
    let isMounted = true;
    console.log("Initialisation de la gestion de session...");
    
    // S'assurer que le chargement ne reste pas bloqué indéfiniment
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("Délai maximum de chargement atteint");
        setLoading(false);
      }
    }, 10000); // 10 secondes maximum pour le chargement
    
    // Configurer l'écouteur d'authentification AVANT de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          console.log("Authentification détectée, utilisateur:", session.user.id);
          try {
            const userProfile = await createUserProfile(session.user);
            
            if (userProfile) {
              console.log("Profil utilisateur chargé:", userProfile.role);
              setUser(userProfile);
            }
          } catch (error) {
            console.error("Erreur lors du chargement du profil:", error);
            toast.error("Erreur lors du chargement de votre profil");
          } finally {
            if (isMounted) setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Déconnexion détectée");
          setUser(null);
          if (isMounted) setLoading(false);
        } else {
          // Pour les autres événements
          if (isMounted) setLoading(false);
        }
      }
    );
    
    // Vérifier s'il existe déjà une session avec un timeout
    const checkSession = async () => {
      try {
        console.log("Vérification de session existante...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          if (isMounted) {
            setLoading(false);
            toast.error("Erreur de connexion au serveur d'authentification");
          }
          return;
        }
        
        if (data.session) {
          console.log("Session existante trouvée:", data.session.user.id);
          try {
            const userProfile = await createUserProfile(data.session.user);
            
            if (userProfile && isMounted) {
              setUser(userProfile);
            }
          } finally {
            if (isMounted) setLoading(false);
          }
        } else {
          console.log("Aucune session active trouvée");
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error("Exception lors de la vérification de session:", error);
        if (isMounted) {
          setLoading(false);
          toast.error("Erreur inattendue lors de l'authentification");
        }
      }
    };
    
    // Commencer la vérification de session
    checkSession();
    
    // Nettoyage
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log("Nettoyage de la gestion de session");
    };
  }, [setUser, setLoading]);
};
