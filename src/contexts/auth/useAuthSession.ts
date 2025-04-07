
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
      
      const { data, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{data: null, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error("Délai d'attente dépassé pour la vérification de session")), 5000)
        )
      ]) as any;
      
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
      async (event, session) => {
        console.log("Événement d'authentification:", event);
        
        // Toujours définir l'état de chargement sur false à la fin, quelle que soit l'issue
        const finalizeAuthProcess = () => {
          setTimeout(() => {
            setLoading(false);
          }, 0);
        };
        
        if (event === 'SIGNED_IN' && session) {
          console.log("Authentification détectée, utilisateur:", session.user.id);
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
            finalizeAuthProcess();
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Déconnexion détectée");
          setUser(null);
          finalizeAuthProcess();
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token rafraîchi");
          finalizeAuthProcess();
        } else if (event === 'USER_UPDATED') {
          console.log("Utilisateur mis à jour");
          finalizeAuthProcess();
        } else {
          // Pour les autres événements
          finalizeAuthProcess();
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
