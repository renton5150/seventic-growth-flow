
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
          window.location.hash.includes("type=recovery") ||
          window.location.hash.includes("type=invite") ||
          window.location.hash.includes("type=signup")
        )) || (window.location.search && (
          window.location.search.includes("type=") || 
          window.location.search.includes("error=") ||
          window.location.search.includes("access_token=")
        ));
        
        console.log("Paramètres d'authentification détectés:", hasAuthParams);
        console.log("Page reset-password détectée:", isOnResetPasswordPage);
        
        // Si nous avons des paramètres d'authentification mais ne sommes pas sur la page reset-password
        if (hasAuthParams && !isOnResetPasswordPage) {
          console.log("Paramètres d'authentification détectés - redirection vers reset-password");
          
          // Construire l'URL de redirection en préservant tous les paramètres
          let redirectUrl = '/reset-password';
          
          // Préserver tous les paramètres de recherche
          if (window.location.search) {
            redirectUrl += window.location.search;
          }
          
          // Préserver le fragment (hash)
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
        if ((window.location.hash && window.location.hash.includes("access_token")) || 
            (window.location.search && window.location.search.includes("access_token"))) {
          console.log("Token d'accès trouvé dans l'URL");
          
          // Récupérer les tokens du hash OU des paramètres de recherche
          let accessToken = null;
          let refreshToken = null;
          
          if (window.location.hash && window.location.hash.includes("access_token")) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            accessToken = hashParams.get("access_token");
            refreshToken = hashParams.get("refresh_token") || '';
            console.log("Access token trouvé dans le hash:", !!accessToken);
          } else if (window.location.search && window.location.search.includes("access_token")) {
            const searchParams = new URLSearchParams(window.location.search);
            accessToken = searchParams.get("access_token");
            refreshToken = searchParams.get("refresh_token") || '';
            console.log("Access token trouvé dans les query params:", !!accessToken);
          }
          
          if (accessToken) {
            try {
              console.log("Configuration de la session avec le token d'accès");
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
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
    
    const sessionHelpers = createAuthSessionHelpers(setUser, setLoading);
    
    const subscription = sessionHelpers.setupAuthListener();
    
    // Vérifier la session après un court délai
    setTimeout(() => {
      if (mounted) {
        sessionHelpers.checkSession()
          .catch(error => {
            console.error("Erreur lors de la vérification de session:", error);
            if (mounted) {
              setLoading(false);
            }
          });
      }
    }, 100);
    
    return () => {
      mounted = false;
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
