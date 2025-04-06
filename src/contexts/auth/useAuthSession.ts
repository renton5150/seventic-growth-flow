
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
    }, 30000); // Délai augmenté à 30 secondes pour éviter les problèmes sur les connexions lentes
    
    // Fonction pour récupérer et définir le profil utilisateur
    const setUserProfile = async (user, session) => {
      try {
        console.log("Récupération du profil pour l'utilisateur:", user.id);
        const userProfile = await createUserProfile(user);
        
        if (!isMounted) return null;
        
        if (userProfile) {
          console.log("Profil chargé avec succès:", userProfile.name, "Rôle:", userProfile.role);
          setUser(userProfile);
          return userProfile;
        } else {
          console.error("Impossible de charger le profil utilisateur");
          return null;
        }
      } catch (error) {
        console.error("Erreur lors de la création du profil utilisateur:", error);
        if (isMounted) toast.error("Erreur lors du chargement de votre profil");
        return null;
      }
    };

    // Configurer l'écouteur de changement d'authentification AVANT de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event, session ? `session active: ${session.user.id}` : "pas de session");
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          try {
            console.log("Authentification réussie, récupération du profil utilisateur");
            const userProfile = await setUserProfile(session.user, session);
            
            // Si le profil a été chargé avec succès
            if (userProfile) {
              console.log("Profil utilisateur défini après connexion:", userProfile);
              
              // Ajouter plus de logs pour déboguer le rôle
              console.log("Rôle de l'utilisateur:", userProfile.role);
              console.log("Est admin:", userProfile.role === "admin");
              
              // Attendre un peu avant de désactiver le chargement pour permettre la redirection
              setTimeout(() => {
                if (isMounted) {
                  console.log("Authentification terminée, chargement désactivé");
                  setLoading(false);
                }
              }, 1000);
            } else {
              // Terminer le chargement même en cas d'échec
              if (isMounted) setLoading(false);
            }
          } catch (error) {
            console.error("Erreur lors de la création du profil utilisateur:", error);
            toast.error("Erreur lors du chargement de votre profil");
            if (isMounted) setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          setUser(null);
          if (isMounted) setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token rafraîchi, mise à jour du profil utilisateur");
          // Rafraîchir le profil utilisateur
          if (session) {
            try {
              await setUserProfile(session.user, session);
            } catch (error) {
              console.error("Erreur lors de la mise à jour du profil:", error);
            } finally {
              if (isMounted) setLoading(false);
            }
          }
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
          setTimeout(() => reject(new Error("Timeout de récupération de session")), 20000);
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
            toast.error("Erreur de connexion au serveur. Veuillez actualiser la page et réessayer.");
          }
          return;
        }
        
        console.log("Résultat de la session:", result.data?.session ? `Session trouvée: ${result.data.session.user.id}` : "Aucune session");
        
        if (result.data?.session && isMounted) {
          try {
            await setUserProfile(result.data.session.user, result.data.session);
          } catch (profileError) {
            console.error("Erreur lors de la création du profil utilisateur:", profileError);
          } finally {
            // Attendre un peu avant de désactiver le chargement pour permettre la redirection
            setTimeout(() => {
              if (isMounted) setLoading(false);
            }, 1000);
          }
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error("Erreur inattendue lors de la vérification de session:", error);
        if (isMounted) setLoading(false);
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
