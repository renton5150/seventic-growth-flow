
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
  
  // Gérer les redirections d'authentification
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const currentUrl = window.location.toString();
        console.log("Vérification des redirections d'authentification. URL actuelle:", currentUrl);
        
        // Vérifier si nous sommes déjà sur la page reset-password
        const isOnResetPasswordPage = window.location.pathname === '/reset-password';
        
        // Vérifier les paramètres d'authentification dans le hash ou l'URL
        const hasAuthParams = (window.location.hash && (
          window.location.hash.includes("access_token") || 
          window.location.hash.includes("error") ||
          window.location.hash.includes("type=")
        )) || (window.location.search && window.location.search.includes("type="));
        
        // Si nous avons des paramètres d'authentification mais ne sommes pas sur la page reset-password
        if (hasAuthParams && !isOnResetPasswordPage) {
          console.log("Paramètres d'authentification détectés - redirection vers reset-password");
          
          // Construire l'URL de redirection en préservant le hash et les paramètres
          let redirectUrl = '/reset-password';
          
          // Ajouter les paramètres de recherche s'il y en a
          if (window.location.search) {
            redirectUrl += window.location.search;
          }
          
          // Ajouter le hash s'il y en a
          if (window.location.hash) {
            redirectUrl += window.location.hash;
          }
          
          console.log("Redirection vers:", redirectUrl);
          window.location.href = redirectUrl;
          return;
        }
        
        // Si nous sommes sur la page reset-password, laisser le composant ResetPassword gérer le reste
        if (isOnResetPasswordPage) {
          console.log("Déjà sur la page reset-password - laissons le composant gérer les paramètres d'auth");
          return;
        }
        
        // Pour les autres pages avec des tokens d'authentification, traiter comme d'habitude
        if (window.location.hash && window.location.hash.includes("access_token")) {
          console.log("Token d'accès trouvé dans le hash URL");
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || '';
          
          if (accessToken) {
            try {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error("Erreur lors de la configuration de la session:", error);
                toast.error(`Erreur d'authentification: ${error.message}`);
              } else {
                console.log("Session définie avec succès à partir de l'URL");
                toast.success("Authentification réussie");
              }
            } catch (err) {
              console.error("Erreur lors de la définition de la session:", err);
              toast.error("Erreur lors de l'authentification");
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors du traitement des paramètres d'authentification:", err);
      }
    };

    handleAuthRedirect();
  }, []);
  
  // Initialiser l'authentification
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Timeout plus court pour une meilleure expérience utilisateur
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
    
    // Petit délai avant de vérifier la session pour éviter les conditions de concurrence
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
