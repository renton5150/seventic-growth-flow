
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
        
        // Extraction des paramètres du hash (prioritaire)
        if (location.hash) {
          console.log("Analyse du hash URL");
          
          // Utiliser un parsing manuel pour éviter les problèmes avec certains caractères
          // Enlever le # du début
          const hashString = location.hash.substring(1);
          
          // Créer un objet avec les paires clé=valeur
          const hashParams: Record<string, string> = {};
          hashString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
              hashParams[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });
          
          console.log("Hash params:", hashParams);
          
          accessToken = hashParams['access_token'] || null;
          refreshToken = hashParams['refresh_token'] || null;
          typeParam = hashParams['type'] || null;
          errorCode = hashParams['error'] || null;
          errorDescription = hashParams['error_description'] || null;
          
          console.log("Hash params trouvés:", { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken, 
            type: typeParam,
            hasError: !!errorCode
          });
          
          // Vérifier le mode d'après le hash
          if (typeParam === "signup" || typeParam === "invite") {
            console.log(`Mode setup détecté dans le hash (type=${typeParam})`);
            setMode("setup");
          } else if (typeParam === "recovery") {
            console.log(`Mode reset détecté dans le hash (type=${typeParam})`);
            setMode("reset");
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
          if (queryParams.get("type") === "signup" || queryParams.get("type") === "invite") {
            console.log(`Mode setup détecté dans les query params`);
            setMode("setup");
          } else if (queryParams.get("type") === "recovery") {
            console.log(`Mode reset détecté dans les query params`);
            setMode("reset");
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
              setIsProcessingToken(false);
            } else {
              console.log("Session configurée avec succès");
              
              // Déterminer le mode basé sur le type dans l'URL ou par défaut "reset"
              if (typeParam === "signup" || typeParam === "invite") {
                console.log("Mode setup confirmé (type signup/invite)");
                setMode("setup");
              } else if (typeParam === "recovery") {
                console.log("Mode reset confirmé (type recovery)");
                setMode("reset");
              }
              
              setIsProcessingToken(false);
            }
          } catch (sessionErr) {
            console.error("Exception lors de la configuration de session:", sessionErr);
            setError("Une erreur s'est produite lors de l'authentification. Veuillez réessayer.");
            setIsProcessingToken(false);
          }
        } else {
          // Vérifier si l'utilisateur a déjà une session active
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log("Session existante détectée - permettre la définition du mot de passe");
            // On a une session, on peut continuer
            setIsProcessingToken(false);
          } else {
            // Si pas de session et pas de token, on ne peut pas continuer
            console.error("Pas de token d'accès valide trouvé et aucune session active");
            setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
            toast.error("Lien invalide", { 
              description: "Le lien de réinitialisation est invalide ou a expiré" 
            });
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
