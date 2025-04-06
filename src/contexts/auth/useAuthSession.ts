
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
    }, 5000); // 5 secondes maximum de chargement
    
    // Configurer l'écouteur de changement d'authentification AVANT de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Événement d'authentification:", event, session ? `session active: ${session.user.id}` : "pas de session");
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          // Utiliser setTimeout pour éviter les deadlocks avec les événements Supabase
          setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              const userProfile = await createUserProfile(session.user);
              setUser(userProfile);
              console.log("Profil utilisateur défini après connexion:", userProfile);
            } catch (error) {
              console.error("Erreur lors de la création du profil utilisateur:", error);
              toast.error("Erreur lors du chargement de votre profil");
            } finally {
              // Terminer le chargement après le traitement de l'événement
              setLoading(false);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          setUser(null);
          setLoading(false);
        } else {
          // Pour les autres événements, assurez-vous également de terminer le chargement
          setLoading(false);
        }
      }
    );
    
    // Ensuite vérifier s'il existe déjà une session
    const checkSession = async () => {
      try {
        console.log("Vérification de session existante...");
        
        // Ajouter un timeout pour la vérification de session
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout de récupération de session")), 5000);
        });
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise, 
          sessionTimeout
        ]).catch(err => {
          console.warn("Timeout ou erreur lors de la vérification de session:", err.message);
          return { data: { session: null }, error: err };
        });
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          if (isMounted) {
            setLoading(false);
            toast.error("Erreur lors de la vérification de votre session");
          }
          return;
        }
        
        console.log("Résultat de la session:", session ? `Session trouvée: ${session.user.id}` : "Aucune session");
        
        if (session && isMounted) {
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
    
    // Exécuter la vérification de session
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
