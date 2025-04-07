
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
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erreur lors de la vérification de session:", error);
        setLoading(false);
        toast.error("Erreur de connexion au serveur d'authentification");
        return;
      }
      
      if (data.session) {
        console.log("Session existante trouvée:", data.session.user.id);
        try {
          const userProfile = await createUserProfile(data.session.user);
          
          if (userProfile) {
            setUser(userProfile);
          } else {
            console.error("Impossible de charger le profil utilisateur");
          }
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
        } finally {
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
      async (event, session) => {
        console.log("Événement d'authentification:", event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log("Authentification détectée, utilisateur:", session.user.id);
          try {
            const userProfile = await createUserProfile(session.user);
            
            if (userProfile) {
              console.log("Profil utilisateur chargé:", userProfile.role);
              setUser(userProfile);
            } else {
              console.error("Profil utilisateur non chargé");
              setLoading(false);
            }
          } catch (error) {
            console.error("Erreur lors du chargement du profil:", error);
            toast.error("Erreur lors du chargement de votre profil");
            setLoading(false);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Déconnexion détectée");
          setUser(null);
          setLoading(false);
        } else {
          // Pour les autres événements
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
