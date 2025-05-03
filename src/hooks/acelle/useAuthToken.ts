
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour gérer l'authentification et les tokens
 * avec rafraîchissement automatique et gestion des erreurs
 * 
 * Ce hook fournit un token d'authentification et des méthodes
 * pour le gérer, tout en s'assurant qu'il reste valide via des
 * rafraîchissements périodiques.
 */
export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<Error | null>(null);

  /**
   * Obtient un token d'authentification valide avec gestion d'erreur améliorée
   * Cette fonction rafraîchit d'abord la session puis récupère le token
   * 
   * @returns Promise<string | null> - Un token valide ou null en cas d'échec
   */
  const getValidAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      console.log("Obtention d'un token d'authentification valide");
      
      // Essayer d'abord de rafraîchir la session pour garantir un token à jour
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("Avertissement lors du rafraîchissement de la session:", refreshError.message);
        } else {
          console.log("Session rafraîchie avec succès");
        }
      } catch (refreshError) {
        console.warn("Erreur lors du rafraîchissement de la session:", refreshError);
        // Continuer malgré l'erreur - on peut toujours essayer d'utiliser la session existante
      }
      
      // Récupérer la session après le rafraîchissement
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erreur d'authentification Supabase:", error.message);
        setRefreshError(error);
        return null;
      }
      
      const token = sessionData?.session?.access_token;
      if (!token) {
        const noTokenError = new Error("Aucun token d'accès disponible dans la session");
        console.error(noTokenError.message);
        setRefreshError(noTokenError);
        return null;
      }
      
      console.log("Token d'authentification récupéré avec succès");
      setAuthToken(token);
      setLastRefresh(new Date());
      return token;
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Exception inconnue lors de l'obtention du token");
      console.error("Exception lors de l'obtention du token d'authentification:", error);
      setRefreshError(error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Charge le token au montage du composant et configure un rafraîchissement périodique
  useEffect(() => {
    let isMounted = true;
    
    const loadToken = async () => {
      if (isMounted) {
        await getValidAuthToken();
      }
    };
    
    loadToken();
    
    // Configure un rafraîchissement périodique
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        console.log("Rafraîchissement périodique du token d'authentification");
        getValidAuthToken();
      }
    }, 25 * 60 * 1000); // 25 minutes
    
    // Nettoyage à la destruction du composant
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [getValidAuthToken]);

  return {
    authToken,
    isRefreshing,
    lastRefresh,
    refreshError,
    getValidAuthToken,
    setAuthToken
  };
};
