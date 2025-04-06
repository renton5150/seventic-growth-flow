
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types/types";
import { AuthContextType, AuthState } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./authUtils";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });
  
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Définir un timeout de sécurité de 5 secondes
    const safetyTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted && authState.loading) {
          console.log("Timeout de chargement atteint, initialisation terminée");
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }, 5000);
    };
    
    // Lancer le timeout immédiatement
    safetyTimeout();
    
    // Configurer l'écouteur d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Événement d'authentification: ${event}`);
        
        if (!mounted) return;
        
        if (session) {
          try {
            console.log("Session active trouvée, chargement du profil");
            const userProfile = await createUserProfile(session.user);
            
            if (mounted) {
              setAuthState({ 
                user: userProfile, 
                loading: false 
              });
              
              // Annuler le timeout puisque nous avons terminé
              clearTimeout(timeoutId);
            }
          } catch (err) {
            console.error("Erreur lors du chargement du profil:", err);
            if (mounted) {
              setAuthState({ user: null, loading: false });
            }
            toast.error("Erreur de chargement du profil");
            clearTimeout(timeoutId);
          }
        } else {
          console.log("Pas de session active");
          if (mounted) {
            setAuthState({ user: null, loading: false });
          }
          clearTimeout(timeoutId);
        }
      }
    );

    // Vérifier la session existante
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur de récupération de session:", error.message);
          if (mounted) setAuthState({ user: null, loading: false });
          return;
        }
        
        if (!data?.session) {
          console.log("Pas de session existante");
          if (mounted) setAuthState({ user: null, loading: false });
        }
        // Si une session existe, onAuthStateChange se chargera du reste
      } catch (err) {
        console.error("Exception lors de la vérification de session:", err);
        if (mounted) setAuthState({ user: null, loading: false });
      }
    };
    
    // Vérifier immédiatement la session
    checkSession();
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`Tentative de connexion: ${email}`);
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Créer une promesse avec timeout
      const loginPromise = new Promise<boolean>(async (resolve, reject) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) {
            console.error("Erreur de connexion:", error.message);
            toast.error("Échec de connexion", { description: error.message });
            setAuthState(prev => ({ ...prev, loading: false }));
            resolve(false);
            return;
          }
          
          if (!data.session) {
            console.error("Session non créée");
            toast.error("Erreur de connexion", { description: "Session non créée" });
            setAuthState(prev => ({ ...prev, loading: false }));
            resolve(false);
            return;
          }
          
          console.log("Connexion réussie");
          // onAuthStateChange mettra à jour l'état utilisateur
          resolve(true);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
          console.error("Exception lors de la connexion:", errMsg);
          toast.error("Erreur", { description: errMsg });
          setAuthState(prev => ({ ...prev, loading: false }));
          reject(err);
        }
      });
      
      // Créer un timeout de 8 secondes
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log("Timeout de connexion");
          setAuthState(prev => ({ ...prev, loading: false }));
          resolve(false);
        }, 8000);
      });
      
      // Utiliser Promise.race pour limiter le temps d'attente
      return await Promise.race([loginPromise, timeoutPromise]);
    } catch (err) {
      console.error("Erreur critique lors de la connexion:", err);
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        toast.error("Échec de la déconnexion");
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
      
      console.log("Déconnexion réussie");
      setAuthState({ user: null, loading: false });
      return true;
    } catch (err) {
      console.error("Exception lors de la déconnexion:", err);
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };
  
  // Propriétés dérivées
  const isAuthenticated = !!authState.user;
  const isAdmin = authState.user?.role === "admin";
  const isSDR = authState.user?.role === "sdr";
  const isGrowth = authState.user?.role === "growth";

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isSDR,
        isGrowth,
        loading: authState.loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
