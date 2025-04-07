
import { useState, ReactNode, useEffect } from "react";
import { User } from "@/types/types";
import { AuthState } from "./types";
import { useAuthOperations } from "./useAuthOperations";
import { createAuthSessionHelpers } from "./useAuthSession";
import AuthContext from "./AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });
  
  const setUser = (user: User | null) => setAuthState(prev => ({ ...prev, user }));
  const setLoading = (loading: boolean) => setAuthState(prev => ({ ...prev, loading }));
  
  const { login, logout } = useAuthOperations(setUser, setLoading);
  
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("error"))) {
          console.log("Détection d'une redirection d'authentification avec hash");
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          
          if (accessToken) {
            console.log("Access token trouvé dans l'URL, tentative de définir une session");
            const refreshToken = hashParams.get("refresh_token") || '';
            
            try {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error("Erreur lors de la configuration de la session:", error);
              } else {
                console.log("Session définie avec succès à partir de l'URL");
              }
            } catch (err) {
              console.error("Erreur lors de la définition de la session:", err);
            }
          }
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
          console.error("Erreur d'authentification détectée dans l'URL:", params.get('error_description'));
          toast.error(params.get('error_description') || "Erreur d'authentification");
        }
      } catch (err) {
        console.error("Erreur lors du traitement des paramètres d'authentification:", err);
      }
    };

    handleAuthRedirect();
  }, []);
  
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Shorter safety timeout (5 seconds instead of 10)
    const safetyTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted && authState.loading) {
          console.log("Timeout de chargement atteint, initialisation terminée");
          setLoading(false);
          toast.error("L'initialisation de l'authentification a pris trop de temps");
        }
      }, 5000);
    };
    
    safetyTimeout();
    
    const sessionHelpers = createAuthSessionHelpers(setUser, setLoading);
    
    const subscription = sessionHelpers.setupAuthListener();
    
    // Introduce small delay before checking session to avoid race conditions
    setTimeout(() => {
      if (mounted) {
        sessionHelpers.checkSession()
          .catch(error => {
            console.error("Erreur lors de la vérification de session:", error);
            if (mounted) {
              setLoading(false);
              toast.error("Erreur lors de la vérification de session");
            }
          });
      }
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

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
