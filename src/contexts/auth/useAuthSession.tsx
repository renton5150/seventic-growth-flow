
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { User } from "@/types/types";
import { toast } from "sonner";

export const useAuthSession = (setUser: (user: User | null) => void, setLoading: (loading: boolean) => void) => {
  // Setup auth state change listener
  const setupAuthListener = () => {
    console.log("Configuration de l'écouteur d'authentification");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Événement d'authentification: ${event}`);
        
        if (session) {
          try {
            console.log("Session active trouvée");
            // Utiliser setTimeout pour éviter les problèmes de timing avec Supabase
            setTimeout(async () => {
              try {
                const userProfile = await createUserProfile(session.user);
                
                setUser(userProfile);
                setLoading(false);
              } catch (err) {
                console.error("Erreur lors du chargement du profil:", err);
                setUser(null);
                setLoading(false);
              }
            }, 0);
          } catch (err) {
            console.error("Erreur lors du traitement de la session:", err);
            setUser(null);
            setLoading(false);
          }
        } else {
          console.log("Pas de session active");
          setUser(null);
          setLoading(false);
        }
      }
    );

    return subscription;
  };

  // Check for existing session
  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erreur de récupération de session:", error.message);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (!data?.session) {
        console.log("Pas de session existante");
        setUser(null);
        setLoading(false);
      }
      // Si une session existe, onAuthStateChange se chargera du reste
    } catch (err) {
      console.error("Exception lors de la vérification de session:", err);
      setUser(null);
      setLoading(false);
    }
  };

  return { setupAuthListener, checkSession };
};
