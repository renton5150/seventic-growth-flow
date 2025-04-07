
import { useState, ReactNode, useEffect } from "react";
import { User } from "@/types/types";
import { AuthState } from "./types";
import { useAuthOperations } from "./useAuthOperations";
import { createAuthSessionHelpers } from "./useAuthSession";
import AuthContext from "./AuthContext";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });
  
  // Setter functions to update the auth state
  const setUser = (user: User | null) => setAuthState(prev => ({ ...prev, user }));
  const setLoading = (loading: boolean) => setAuthState(prev => ({ ...prev, loading }));
  
  // Custom hooks for auth operations and session management
  const { login, logout } = useAuthOperations(setUser, setLoading);
  
  // Intercepter les redirections d'authentification et vérifier les paramètres URL
  useEffect(() => {
    const handleAuthRedirect = () => {
      try {
        // Vérifier s'il y a des fragments de type hash dans l'URL (typique des redirections auth)
        if (window.location.hash && window.location.hash.includes("access_token")) {
          console.log("Détection d'une redirection d'authentification avec hash");
        }

        // Vérifier s'il y a des paramètres d'erreur dans l'URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
          console.error("Erreur d'authentification détectée dans l'URL:", params.get('error_description'));
        }
      } catch (err) {
        console.error("Erreur lors du traitement des paramètres d'authentification:", err);
      }
    };

    handleAuthRedirect();
  }, []);
  
  // Initialize auth session
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Réduire le timeout à 10 secondes (au lieu de 5) pour éviter de bloquer trop longtemps
    const safetyTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted && authState.loading) {
          console.log("Timeout de chargement atteint, initialisation terminée");
          setLoading(false);
          toast.error("L'initialisation de l'authentification a pris trop de temps");
        }
      }, 10000);
    };
    
    // Start timeout immediately
    safetyTimeout();
    
    // Create auth session helpers
    const sessionHelpers = createAuthSessionHelpers(setUser, setLoading);
    
    // Setup auth listener first
    const subscription = sessionHelpers.setupAuthListener();
    
    // Then check for existing session
    sessionHelpers.checkSession()
      .catch(error => {
        console.error("Erreur lors de la vérification de session:", error);
        // Assurer que l'état de chargement est terminé même en cas d'erreur
        if (mounted) {
          setLoading(false);
          toast.error("Erreur lors de la vérification de session");
        }
      });
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Derived properties
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
