
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ConnectionStatus = "online" | "offline" | "checking";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const checkServerConnection = useCallback(async () => {
    try {
      setNetworkStatus("checking");
      
      // Check if browser is online first
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
        return false;
      }
      
      // Use Promise.race for timeout handling instead of AbortController
      const checkPromise = supabase.from("profiles")
        .select("count")
        .limit(1);
      
      const timeoutPromise = new Promise<{error: {message: string}}>((_, reject) => {
        setTimeout(() => {
          reject({ error: { message: "Le serveur met trop de temps à répondre" } });
        }, 3000); // Reduced from 5000ms to 3000ms
      });
      
      const startTime = Date.now();
      const result = await Promise.race([checkPromise, timeoutPromise]);
      const endTime = Date.now();
      console.log(`Temps de réponse du serveur: ${endTime - startTime}ms`);
      
      if (result.error) {
        console.error("Erreur de connexion:", result.error);
        setNetworkStatus("offline");
        setError(`Erreur de connexion au serveur: ${result.error.message}`);
        return false;
      }
      
      setNetworkStatus("online");
      setError(null);
      return true;
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      
      if (err.message && err.message.includes("trop de temps")) {
        setNetworkStatus("offline");
        setError("Le serveur met trop de temps à répondre");
      } else {
        setNetworkStatus("offline");
        setError("Impossible de se connecter au serveur Supabase");
      }
      
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
    checkServerConnection
  };
};
