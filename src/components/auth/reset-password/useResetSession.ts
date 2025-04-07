
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useResetSession = () => {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"reset" | "setup">("reset");
  const location = useLocation();

  // Récupérer les paramètres de l'URL et configurer la session
  useEffect(() => {
    const setupSession = async () => {
      try {
        console.log("Initialisation de la page ResetPassword");
        console.log("URL hash:", location.hash);
        console.log("URL search:", location.search);
        
        // Essayer d'abord de récupérer les tokens depuis l'URL
        let queryParams = new URLSearchParams(location.search);
        let accessToken = queryParams.get("access_token");
        let refreshToken = queryParams.get("refresh_token");
        let type = queryParams.get("type");

        // Si pas de tokens dans les query params, essayer depuis le hash
        if (!accessToken && location.hash) {
          console.log("Recherche de tokens dans le hash URL");
          const hashParams = new URLSearchParams(location.hash.substring(1));
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          type = hashParams.get("type");
        }

        // Vérifier si on a un token de vérification d'email
        if (location.hash && location.hash.includes("type=signup")) {
          console.log("Détection du mode configuration (signup)");
          setMode("setup");
        } else if (type === "signup") {
          console.log("Détection du mode configuration via query parameter");
          setMode("setup");
        }

        // Si on a un token, configurer la session
        if (accessToken) {
          console.log("Access token trouvé, configuration de la session");
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Erreur lors de la configuration de la session:", error);
            setError(`Erreur d'authentification: ${error.message}`);
          } else {
            console.log("Session configurée avec succès");
          }
        } else {
          // Vérifier s'il y a un code d'erreur dans l'URL
          const errorCode = queryParams.get("error");
          const errorDescription = queryParams.get("error_description");
          
          if (errorCode) {
            console.error("Erreur dans les paramètres URL:", errorCode, errorDescription);
            setError(`Erreur: ${errorDescription || errorCode}`);
          } else if (!location.hash && !queryParams.toString()) {
            // Si aucun paramètre et aucun hash, probablement accès direct à la page
            console.error("Accès direct à la page sans paramètres");
            setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'analyse des paramètres URL:", err);
        setError("Une erreur s'est produite lors du traitement du lien. Veuillez réessayer ou demander un nouveau lien.");
      }
    };

    setupSession();
  }, [location]);

  return { error, setError, mode };
};
