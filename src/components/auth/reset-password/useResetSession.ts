
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
            setMode(hashParams.get("type") === "recovery" ? "reset" : "setup");
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
            setMode(queryParams.get("type") === "recovery" ? "reset" : "setup");
          }
        }

        // Cas spécial: si on a un type="signup" ou "invite" ou "recovery" mais pas d'access_token
        // C'est probablement une tentative d'inscription ou d'invitation avec un lien malformé
        if (!accessToken && typeParam && (typeParam === "signup" || typeParam === "invite" || typeParam === "recovery")) {
          console.log(`Type '${typeParam}' détecté sans token - probablement un lien incomplet`);
          setMode(typeParam === "recovery" ? "reset" : "setup"); 
          
          // Vérifier si l'utilisateur a une session existante
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log("Session existante trouvée - continuons avec cette session");
            // On peut continuer avec la session existante
            setIsProcessingToken(false);
            return;
          } else {
            // Si pas de session et pas de token, on ne peut pas continuer
            console.error("Pas de session existante et pas de token");
            setError("Lien d'authentification incomplet. Veuillez utiliser le lien complet envoyé par email.");
            toast.error("Lien incomplet", { description: "Le lien ne contient pas les informations nécessaires" });
            setIsProcessingToken(false);
            return;
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
              
              // Déterminer le mode basé sur le type dans l'URL ou par défaut "reset"
              if (typeParam === "signup" || typeParam === "invite") {
                console.log("Mode setup détecté par le type:", typeParam);
                setMode("setup");
              } else if (typeParam === "recovery") {
                console.log("Mode reset détecté par le type:", typeParam);
                setMode("reset");
              } else if (location.hash.includes("type=signup") || location.hash.includes("type=invite")) {
                console.log("Mode setup détecté dans le hash");
                setMode("setup");
              } else if (location.hash.includes("type=recovery")) {
                console.log("Mode reset détecté dans le hash");
                setMode("reset");
              } else {
                // Si le token semble être pour une réinitialisation de mot de passe
                console.log("Type non spécifié, détection par contenu URL");
                if (location.hash.includes("refresh_token") || location.hash.includes("recovery") || 
                    location.search.includes("refresh_token") || location.search.includes("recovery")) {
                  console.log("Mode reset détecté par le contenu de l'URL");
                  setMode("reset");
                }
              }
              console.log("Mode final déterminé:", mode);
            }
          } catch (sessionErr) {
            console.error("Exception lors de la configuration de session:", sessionErr);
            setError("Une erreur s'est produite lors de l'authentification. Veuillez réessayer.");
          } finally {
            setIsProcessingToken(false);
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
          setIsProcessingToken(false);
        } else if (!location.hash && !location.search) {
          // Si aucun paramètre et aucun hash, probablement accès direct à la page
          console.error("Accès direct à la page sans paramètres");
          setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
          setIsProcessingToken(false);
        } else {
          // Vérifier si l'utilisateur a déjà une session active
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log("Session existante détectée - permettre la définition du mot de passe");
            // On a une session, on peut continuer
            setIsProcessingToken(false);
          } else {
            // Fallback pour tout autre cas où nous n'avons pas de token valide
            console.error("Impossible de trouver un token valide dans l'URL");
            setError("Lien d'authentification invalide ou expiré. Veuillez demander un nouveau lien.");
            setIsProcessingToken(false);
          }
        }

      } catch (err) {
        console.error("Erreur lors de l'analyse des paramètres URL:", err);
        setError("Une erreur s'est produite lors du traitement du lien. Veuillez réessayer.");
        setIsProcessingToken(false);
      }
    };

    setupSession();
  }, [location, navigate]);

  return { error, setError, mode, isProcessingToken };
};
