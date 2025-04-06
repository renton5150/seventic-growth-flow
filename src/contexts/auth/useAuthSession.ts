
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { toast } from "sonner";

export const useAuthSession = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Configurer la gestion de session
  useEffect(() => {
    let isMounted = true;
    console.log("Initialisation de la gestion de session...");
    
    // Important: définir un délai maximum pour le chargement
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("Délai maximum de chargement atteint, arrêt du chargement");
        setLoading(false);
      }
    }, 3000); // Réduire à 3 secondes maximum de chargement
    
    // Configurer l'écouteur de changement d'authentification AVANT de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event, session ? "session active" : "pas de session");
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const userProfile = await createUserProfile(session.user);
            if (isMounted) {
              setUser(userProfile);
              console.log("Profil utilisateur défini après connexion:", userProfile);
            }
          } catch (error) {
            console.error("Erreur lors de la création du profil utilisateur:", error);
            toast.error("Erreur lors du chargement de votre profil");
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          if (isMounted) {
            setUser(null);
          }
        }
        
        // Terminer le chargement après le traitement de l'événement d'authentification
        if (isMounted) {
          setLoading(false);
          console.log("Chargement terminé après événement d'authentification");
        }
      }
    );
    
    // Ensuite vérifier s'il existe déjà une session
    const checkSession = async () => {
      try {
        console.log("Vérification de session existante...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          if (isMounted) {
            setLoading(false);
            toast.error("Erreur lors de la vérification de votre session");
          }
          return;
        }
        
        console.log("Résultat de la session:", session ? "Session trouvée" : "Aucune session");
        
        if (session) {
          try {
            const userProfile = await createUserProfile(session.user);
            if (isMounted) {
              setUser(userProfile);
              console.log("Profil utilisateur défini à partir d'une session existante:", userProfile);
            }
          } catch (profileError) {
            console.error("Erreur lors de la création du profil utilisateur:", profileError);
          }
        }
      } catch (error) {
        console.error("Erreur inattendue lors de la vérification de session:", error);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
          console.log("Chargement terminé après vérification de session");
        }
      }
    };
    
    checkSession();
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log("Nettoyage des écouteurs d'authentification");
    };
  }, [setUser, setLoading]);
};
