
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useResetSession = () => {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"reset" | "setup">("reset");
  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Récupérer les paramètres de l'URL et configurer la session
  useEffect(() => {
    const setupSession = async () => {
      try {
        console.log("Initialisation de la page ResetPassword");
        console.log("URL path:", location.pathname);
        console.log("URL hash:", location.hash);
        console.log("URL search:", location.search);
        
        // Variables pour stocker les tokens et les paramètres
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let typeParam: string | null = null;
        let errorCode: string | null = null;
        let errorDescription: string | null = null;
        
        // Vérifier d'abord le hash (prioritaire car contient souvent les tokens)
        if (location.hash) {
          console.log("Analyse du hash URL");
          const hashParams = new URLSearchParams(location.hash.substring(1));
          
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          typeParam = hashParams.get("type");
          errorCode = hashParams.get("error");
          errorDescription = hashParams.get("error_description");
          
          console.log("Hash params trouvés:", { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken, 
            type: typeParam,
            hasError: !!errorCode
          });
          
          // Vérifier le mode d'après le hash
          if (hashParams.get("type") === "signup" || 
              hashParams.get("type") === "invite" || 
              hashParams.get("type") === "recovery") {
            console.log(`Mode ${hashParams.get("type")} détecté dans le hash`);
            setMode("setup");
          }
          
          // Gérer spécifiquement les erreurs dans le hash
          if (errorCode) {
            // Erreur OTP expirée ou invalide
            if (errorCode === "access_denied" && hashParams.get("error_code") === "otp_expired") {
              console.error("Lien OTP expiré ou invalide");
              setError("Ce lien a expiré ou n'est plus valide. Veuillez demander un nouveau lien.");
              toast.error("Lien expiré", { 
                description: "Veuillez demander un nouveau lien d'invitation ou de réinitialisation" 
              });
              setIsProcessingToken(false);
              return;
            }
          }
        }
        
        // Si on n'a pas trouvé de tokens dans le hash, vérifier les query params
        if (!accessToken) {
          console.log("Recherche dans les query params");
          const queryParams = new URLSearchParams(location.search);
          
          accessToken = accessToken || queryParams.get("access_token");
          refreshToken = refreshToken || queryParams.get("refresh_token");
          typeParam = typeParam || queryParams.get("type");
          errorCode = errorCode || queryParams.get("error");
          errorDescription = errorDescription || queryParams.get("error_description");
          
          console.log("Query params trouvés:", { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken, 
            type: typeParam,
            hasError: !!errorCode
          });
          
          // Vérifier le mode d'après les query params
          if (queryParams.get("type") === "signup" || 
              queryParams.get("type") === "invite" || 
              queryParams.get("type") === "recovery") {
            console.log(`Mode ${queryParams.get("type")} détecté dans les query params`);
            setMode("setup");
          }
        }

        // Si on a un token, configurer la session
        if (accessToken) {
          console.log("Access token trouvé, configuration de la session");
          
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (sessionError) {
              console.error("Erreur lors de la configuration de la session:", sessionError);
              setError(`Erreur d'authentification: ${sessionError.message}`);
              toast.error(`Erreur d'authentification: ${sessionError.message}`);
            } else {
              console.log("Session configurée avec succès");
              toast.success("Authentification réussie");
              
              // Si mode setup et pas d'autres paramètres, forcer le mode setup
              if (typeParam === "signup" || typeParam === "invite" || typeParam === "recovery" || 
                  location.hash.includes("type=signup") || location.hash.includes("type=invite") || 
                  location.hash.includes("type=recovery")) {
                console.log("Configuration du mode setup confirmée");
                setMode("setup");
              }
            }
          } catch (sessionErr) {
            console.error("Exception lors de la configuration de session:", sessionErr);
            setError("Une erreur s'est produite lors de l'authentification. Veuillez réessayer.");
          }
        } else if (errorCode) {
          // Si pas de token mais un code d'erreur, afficher l'erreur
          console.error("Erreur dans les paramètres URL:", errorCode, errorDescription);
          
          // Message d'erreur personnalisé pour le cas OTP expiré
          if (errorCode === "access_denied" && location.search.includes("error_code=otp_expired")) {
            setError("Ce lien a expiré ou n'est plus valide. Veuillez demander un nouveau lien.");
            toast.error("Lien expiré", { description: "Veuillez demander un nouveau lien" });
          } else {
            setError(`Erreur: ${errorDescription || errorCode}`);
            toast.error("Erreur d'authentification");
          }
        } else if (!location.hash && !location.search) {
          // Si aucun paramètre et aucun hash, probablement accès direct à la page
          console.error("Accès direct à la page sans paramètres");
          setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
        } else {
          // Fallback pour tout autre cas où nous n'avons pas de token valide
          console.error("Impossible de trouver un token valide dans l'URL");
          setError("Lien d'authentification invalide ou expiré. Veuillez demander un nouveau lien.");
        }

      } catch (err) {
        console.error("Erreur lors de l'analyse des paramètres URL:", err);
        setError("Une erreur s'est produite lors du traitement du lien. Veuillez réessayer.");
      } finally {
        // Toujours terminer le traitement du token
        setIsProcessingToken(false);
      }
    };

    setupSession();
  }, [location, navigate]);

  return { error, setError, mode, isProcessingToken };
};
