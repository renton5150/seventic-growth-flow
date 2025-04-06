
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
  
  // Vérification de session et configuration de l'écouteur d'état
  useEffect(() => {
    let isMounted = true;
    console.log("Initialisation de l'authentification...");
    
    // Vérifier la session existante
    const checkSession = async () => {
      try {
        console.log("Vérification de session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erreur de session:", sessionError);
          if (isMounted) setAuthState({ user: null, loading: false });
          return;
        }
        
        if (sessionData?.session) {
          console.log("Session trouvée, chargement du profil...");
          try {
            const userProfile = await createUserProfile(sessionData.session.user);
            if (isMounted) {
              console.log("Profil chargé:", userProfile);
              setAuthState({ user: userProfile, loading: false });
            }
          } catch (err) {
            console.error("Erreur de chargement de profil:", err);
            if (isMounted) setAuthState({ user: null, loading: false });
          }
        } else {
          console.log("Pas de session active");
          if (isMounted) setAuthState({ user: null, loading: false });
        }
      } catch (err) {
        console.error("Exception lors de la vérification:", err);
        if (isMounted) setAuthState({ user: null, loading: false });
      }
    };
    
    // Configurer l'écouteur d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Événement d'authentification:", event);
      
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        try {
          console.log("Connexion détectée, chargement du profil utilisateur");
          const userProfile = await createUserProfile(session.user);
          if (isMounted) setAuthState({ user: userProfile, loading: false });
        } catch (err) {
          console.error("Erreur lors du chargement du profil:", err);
          if (isMounted) setAuthState({ user: null, loading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("Déconnexion détectée");
        if (isMounted) setAuthState({ user: null, loading: false });
      }
    });
    
    // Vérifier la session au démarrage
    checkSession();
    
    // Nettoyage
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
      console.log("Nettoyage de l'authentification");
    };
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      console.log("Tentative de connexion pour:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur de connexion:", error.message);
        toast.error("Échec de la connexion", { description: error.message });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
      
      console.log("Connexion réussie");
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Exception lors de la connexion:", errMsg);
      toast.error("Erreur", { description: errMsg });
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  // Fonction de déconnexion
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
