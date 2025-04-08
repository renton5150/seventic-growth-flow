
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
        const currentUrl = window.location.toString();
        console.log("Vérification des redirections d'authentification. URL actuelle:", currentUrl);
        
        // Vérifier si la page actuelle contient un hash avec des tokens
        if (window.location.hash && (
          window.location.hash.includes("access_token") || 
          window.location.hash.includes("error") ||
          window.location.hash.includes("type=signup") ||
          window.location.hash.includes("type=recovery")
        )) {
          console.log("Détection d'une redirection d'authentification avec hash");
          
          // Si c'est une authentification de type signup, rediriger vers la page reset-password
          if (window.location.hash.includes("type=signup") || 
              window.location.hash.includes("type=recovery") || 
              window.location.hash.includes("type=invite")) {
            
            console.log("Redirection de type signup/recovery/invite détectée");
            
            // Conserver le hash lors de la redirection
            if (window.location.pathname !== "/reset-password") {
              const fullHash = window.location.hash;
              console.log("Redirection vers /reset-password avec hash:", fullHash);
              
              // Rediriger sans perdre le hash
              window.location.href = `/reset-password${fullHash}`;
              return; // Arrêter l'exécution ici pour éviter de traiter le hash deux fois
            }
          }
          
          // Pour les autres types d'authentification, traiter le token
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

        // Vérifier les paramètres dans la query string pour les erreurs
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
          console.error("Erreur d'authentification détectée dans l'URL:", params.get('error_description'));
          toast.error(params.get('error_description') || "Erreur d'authentification");
        }
        
        // Traitement spécial pour les redirections de type signup dans la query string
        if (params.get('type') === 'signup' && window.location.pathname !== "/reset-password") {
          console.log("Redirection de type signup détectée dans les query params");
          // Rediriger vers la page de réinitialisation
          window.location.href = `/reset-password${window.location.search}`;
          return;
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
