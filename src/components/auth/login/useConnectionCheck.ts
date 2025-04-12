
import { useState, useEffect, useCallback } from "react";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";

export type ConnectionStatus = "online" | "offline" | "checking";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkServerConnection = useCallback(async () => {
    try {
      setNetworkStatus("checking");
      setError(null);
      
      // Vérifier d'abord si le navigateur est en ligne
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
        return false;
      }
      
      // Tester la connexion à Supabase avec nouvelles tentatives
      const isConnected = await checkSupabaseConnection(3, 500);
      
      if (isConnected) {
        setNetworkStatus("online");
        setError(null);
        setRetryCount(0); // Réinitialiser le compteur de tentatives
        return true;
      } else {
        setNetworkStatus("offline");
        setRetryCount(prev => prev + 1);
        
        // Message d'erreur adaptatif
        if (retryCount >= 3) {
          setError("Impossible d'établir une connexion stable avec le serveur. Veuillez réessayer plus tard ou contacter le support.");
        } else {
          setError("Le serveur met trop de temps à répondre. Vérifiez votre connexion ou réessayez.");
        }
        return false;
      }
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      
      setNetworkStatus("offline");
      setError("Une erreur inattendue s'est produite lors de la vérification de la connexion.");
      return false;
    }
  }, [retryCount]);

  // Vérifier la connexion au chargement du composant
  useEffect(() => {
    console.log("Vérification de la connexion au serveur...");
    checkServerConnection();
    
    // Vérifier à nouveau la connexion si l'utilisateur revient en ligne
    const handleOnline = () => {
      console.log("Connexion internet rétablie, vérification du serveur...");
      checkServerConnection();
    };
    
    const handleOffline = () => {
      console.log("Connexion internet perdue");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerConnection]);

  return {
    networkStatus,
    error,
    setError,
    checkServerConnection,
    retryCount
  };
};
