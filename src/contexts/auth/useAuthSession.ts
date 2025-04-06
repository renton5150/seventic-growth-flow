
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

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
    }, 8000); // Délai augmenté à 8 secondes pour éviter les timeouts trop rapides
    
    // Configurer l'écouteur de changement d'authentification AVANT de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event, session ? `session active: ${session.user.id}` : "pas de session");
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const userProfile = await createUserProfile(session.user);
            if (isMounted) {
              setUser(userProfile);
              console.log("Profil utilisateur défini après connexion:", userProfile);
              
              // Ajouter plus de logs pour déboguer le rôle
              if (userProfile) {
                console.log("Rôle de l'utilisateur:", userProfile.role);
                console.log("Est admin:", userProfile.role === "admin");
              }
            }
          } catch (error) {
            console.error("Erreur lors de la création du profil utilisateur:", error);
            toast.error("Erreur lors du chargement de votre profil");
          } finally {
            // Terminer le chargement après le traitement de l'événement
            if (isMounted) setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          setUser(null);
          if (isMounted) setLoading(false);
        } else {
          // Pour les autres événements, assurez-vous également de terminer le chargement
          if (isMounted) setLoading(false);
        }
      }
    );
    
    // Ensuite vérifier s'il existe déjà une session
    const checkSession = async () => {
      try {
        console.log("Vérification de session existante...");
        
        // Réduire le timeout pour la vérification de session
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise<{ data: { session: null }, error: AuthError }>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout de récupération de session")), 7000);
        });
        
        const result = await Promise.race([
          sessionPromise, 
          sessionTimeout
        ]).catch(err => {
          console.warn("Timeout ou erreur lors de la vérification de session:", err.message);
          return { data: { session: null }, error: { message: "Délai d'attente dépassé pour la récupération de session" } as AuthError };
        });
        
        if ('error' in result && result.error) {
          console.error("Erreur lors de la vérification de session:", result.error);
          if (isMounted) {
            setLoading(false);
            // Message d'erreur plus convivial
            toast.error("Erreur de connexion au serveur. Veuillez réessayer.");
          }
          return;
        }
        
        console.log("Résultat de la session:", result.data?.session ? `Session trouvée: ${result.data.session.user.id}` : "Aucune session");
        
        if (result.data?.session && isMounted) {
          try {
            const userProfile = await createUserProfile(result.data.session.user);
            if (isMounted) {
              setUser(userProfile);
              console.log("Profil utilisateur défini à partir d'une session existante:", userProfile);
              
              // Ajouter plus de logs pour déboguer le rôle
              if (userProfile) {
                console.log("Rôle de l'utilisateur:", userProfile.role);
                console.log("Est admin:", userProfile.role === "admin");
              }
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
