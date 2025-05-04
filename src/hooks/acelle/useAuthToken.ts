
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Charger initialement le token d'authentification
  useEffect(() => {
    const loadAuthToken = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setAuthToken(sessionData.session.access_token);
          console.log("Token d'authentification initial chargé");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du token d'authentification:", error);
      }
    };
    
    loadAuthToken();
  }, []);
  
  // Actualiser périodiquement le token pour éviter l'expiration
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.warn("Impossible de rafraîchir la session:", error);
        }
        
        if (data?.session) {
          setAuthToken(data.session.access_token);
          console.log("Token d'authentification rafraîchi");
        }
      } catch (err) {
        console.error("Erreur lors du rafraîchissement du token:", err);
      }
    }, 10 * 60 * 1000); // Toutes les 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Récupérer un token frais
  const getValidAuthToken = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      console.log("Récupération d'un token valide...");
      
      // D'abord vérifier si le token actuel est valide
      if (authToken) {
        console.log("Utilisation du token existant");
        setIsRefreshing(false);
        return authToken;
      }
      
      // Si pas de token disponible, essayer de rafraîchir la session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Erreur lors du rafraîchissement de la session:", error);
        return null;
      }
      
      const newToken = data?.session?.access_token || null;
      setAuthToken(newToken);
      
      if (newToken) {
        console.log("Nouveau token obtenu après rafraîchissement");
      } else {
        console.warn("Aucun token n'a pu être obtenu");
      }
      
      return newToken;
    } catch (err) {
      console.error("Erreur lors de la récupération d'un token valide:", err);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [authToken]);

  return { 
    authToken, 
    setAuthToken, 
    getValidAuthToken, 
    isRefreshing 
  };
};
