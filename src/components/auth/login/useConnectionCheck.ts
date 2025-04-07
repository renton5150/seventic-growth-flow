
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ConnectionStatus = "online" | "offline" | "checking";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const checkServerConnection = useCallback(async () => {
    try {
      setNetworkStatus("checking");
      const startTime = Date.now();
      // Add a timeout to avoid blocking too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const { error } = await supabase.from("profiles")
          .select("count")
          .limit(1)
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.log(`Temps de réponse du serveur: ${endTime - startTime}ms`);
        
        if (error) {
          console.error("Erreur de connexion:", error);
          setNetworkStatus("offline");
          setError(`Erreur de connexion au serveur: ${error.message}`);
          return false;
        }
        
        setNetworkStatus("online");
        setError(null);
        return true;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error("Requête annulée par délai d'attente");
          setNetworkStatus("offline");
          setError("Le serveur met trop de temps à répondre");
        } else {
          console.error("Erreur lors de la requête:", err);
          setNetworkStatus("offline");
          setError("Erreur lors de la connexion au serveur");
        }
        return false;
      }
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      setNetworkStatus("offline");
      setError("Impossible de se connecter au serveur Supabase");
      return false;
    }
  }, []);

  // Check connection when component mounts
  useEffect(() => {
    console.log("Vérification de la connexion au serveur...");
    checkServerConnection();
    
    // Check connection again if the user comes back online
    const handleOnline = () => {
      console.log("Connexion internet rétablie, vérification du serveur...");
      checkServerConnection();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkServerConnection]);

  return {
    networkStatus,
    error,
    setError,
    checkServerConnection
  };
};
