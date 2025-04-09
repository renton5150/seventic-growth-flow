
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { extractAuthTokens, determineResetMode } from "./utils/tokenUtils";
import { configureSession, checkExistingSession } from "./utils/sessionManager";

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
        
        // Extraction des tokens et paramètres
        const { 
          accessToken, 
          refreshToken, 
          typeParam,
          errorCode,
          errorDescription 
        } = extractAuthTokens(location);
        
        // Déterminer le mode en fonction du type
        if (typeParam) {
          const detectedMode = determineResetMode(typeParam);
          setMode(detectedMode);
        }

        // Si on a un token, configurer la session
        if (accessToken) {
          console.log("Access token trouvé, configuration de la session");
          
          const { success, error: sessionError } = await configureSession(accessToken, refreshToken);
          
          if (!success) {
            console.error("Échec de la configuration de session:", sessionError);
            setError(sessionError || "Erreur lors de l'authentification");
            toast.error("Erreur d'authentification", { 
              description: sessionError 
            });
            setIsProcessingToken(false);
            return;
          }
          
          // Confirmer le mode après avoir configuré la session
          if (typeParam) {
            setMode(determineResetMode(typeParam));
          }
          
          setIsProcessingToken(false);
        } else {
          // Vérifier si l'utilisateur a déjà une session active
          const hasExistingSession = await checkExistingSession();
          
          if (hasExistingSession) {
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
