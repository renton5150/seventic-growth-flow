
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour gérer l'authentification et les tokens
 * avec rafraîchissement automatique
 */
export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fonction pour obtenir un token d'authentification valide
  const getValidAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsRefreshing(true);
      console.log("Obtention d'un token d'authentification valide");
      
      // Essayer d'abord de rafraîchir la session pour garantir un token à jour
      try {
        await supabase.auth.refreshSession();
        console.log("Session rafraîchie avec succès");
      } catch (refreshError) {
        console.warn("Erreur lors du rafraîchissement de la session:", refreshError);
      }
      
      // Récupérer la session après le rafraîchissement
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erreur d'authentification Supabase:", error.message);
        return null;
      }
      
      const token = sessionData?.session?.access_token;
      if (!token) {
        console.error("Aucun token d'accès disponible dans la session");
        return null;
      }
      
      console.log("Token d'authentification récupéré avec succès");
      setAuthToken(token);
      return token;
    } catch (e) {
      console.error("Exception lors de l'obtention du token d'authentification:", e);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Charge le token au montage du composant
  useEffect(() => {
    getValidAuthToken();
    
    // Configure un rafraîchissement périodique
    const refreshInterval = setInterval(() => {
      console.log("Rafraîchissement périodique du token d'authentification");
      getValidAuthToken();
    }, 25 * 60 * 1000); // 25 minutes
    
    return () => clearInterval(refreshInterval);
  }, [getValidAuthToken]);

  return {
    authToken,
    isRefreshing,
    getValidAuthToken,
    setAuthToken
  };
};
