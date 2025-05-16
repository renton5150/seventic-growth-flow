
import { useState, useEffect, useCallback } from "react";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";

export type ConnectionStatus = "online" | "offline" | "checking";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>("online"); // Définir comme "online" par défaut
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkServerConnection = useCallback(async () => {
    try {
      // Vérifier d'abord si le navigateur est en ligne
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
        return false;
      }
      
      // Considérer la connexion comme valide par défaut et ne la vérifier qu'en cas d'erreur évidente
      setNetworkStatus("online");
      setError(null);
      return true;
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      
      // Ne signaler hors ligne qu'en cas d'erreur réelle
      setNetworkStatus("offline");
      setError("Une erreur inattendue s'est produite lors de la vérification de la connexion.");
      return false;
    }
  }, [retryCount]);

  // Vérifier la connexion uniquement si l'utilisateur est hors ligne
  useEffect(() => {
    console.log("Initialisation de la vérification de connexion...");
    
    // Ne vérifie la connexion que si l'utilisateur est explicitement hors ligne
    const handleOffline = () => {
      console.log("Connexion internet perdue");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    const handleOnline = () => {
      console.log("Connexion internet rétablie");
      setNetworkStatus("online");
      setError(null);
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
