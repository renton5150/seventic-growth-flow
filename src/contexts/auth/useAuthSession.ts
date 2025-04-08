
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { toast } from "sonner";

// Converted to a regular function that returns the required session utilities
export const createAuthSessionHelpers = (
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void
) => {
  // Check for existing session
  const checkSession = async () => {
    try {
      console.log("Vérification de session existante...");
      
      // Utiliser une promesse simple pour éviter les problèmes de timing
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erreur lors de la vérification de session:", error);
        setLoading(false);
        toast.error("Erreur de connexion au serveur d'authentification");
        return;
      }
      
      if (data?.session) {
        console.log("Session existante trouvée:", data.session.user.id);
        try {
          const userProfile = await createUserProfile(data.session.user);
          
          if (userProfile) {
            setUser(userProfile);
          } else {
            console.error("Impossible de charger le profil utilisateur");
            toast.error("Impossible de charger votre profil utilisateur");
          }
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
          toast.error("Erreur lors du chargement de votre profil");
        } finally {
          // Toujours terminer le chargement
          setLoading(false);
        }
      } else {
        console.log("Aucune session active trouvée");
        setLoading(false);
      }
    } catch (error) {
      console.error("Exception lors de la vérification de session:", error);
      setLoading(false);
      toast.error("Erreur inattendue lors de l'authentification");
    }
  };

  // Setup auth listener
  const setupAuthListener = () => {
    console.log("Configuration de l'écouteur d'authentification");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Événement d'authentification:", event);
        
        // Immediately set loading to false for certain events
        if (event === 'SIGNED_OUT') {
          console.log(`Événement ${event} détecté, mise à jour immédiate de l'état`);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // For sign in and other events that need profile loading
        if (session) {
          console.log("Session d'authentification détectée, utilisateur:", session.user.id);
          
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(async () => {
            try {
              const userProfile = await createUserProfile(session.user);
              
              if (userProfile) {
                console.log("Profil utilisateur chargé:", userProfile.role);
                setUser(userProfile);
              } else {
                console.error("Profil utilisateur non chargé");
                toast.error("Impossible de charger votre profil");
                setUser(null);
              }
            } catch (error) {
              console.error("Erreur lors du chargement du profil:", error);
              toast.error("Erreur lors du chargement de votre profil");
              setUser(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          // Fallback for any other events
          console.log(`Autre événement d'authentification: ${event}`);
          setLoading(false);
        }
      }
    );
    
    return subscription;
  };

  // Return the session utility functions
  return {
    checkSession,
    setupAuthListener
  };
};
