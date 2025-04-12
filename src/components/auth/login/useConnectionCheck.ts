
import { useState, useEffect, useCallback } from "react";
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client";

export type ConnectionStatus = "online" | "offline" | "checking";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const checkServerConnection = useCallback(async () => {
    try {
      setNetworkStatus("checking");
      
      // Vérifier d'abord si le navigateur est en ligne
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
        return false;
      }
      
      // Utiliser le test de connexion amélioré
      const startTime = Date.now();
      const isConnected = await testSupabaseConnection();
      const responseTime = Date.now() - startTime;
      
      console.log(`Temps de réponse du serveur Supabase: ${responseTime}ms`);
      
      if (!isConnected) {
        setNetworkStatus("offline");
        
        if (responseTime >= 5000) {
          setError("Le serveur met trop de temps à répondre (timeout). Vérifiez votre connexion ou réessayez plus tard.");
        } else {
          setError("Impossible de se connecter au serveur Supabase. Vérifiez votre connexion ou réessayez plus tard.");
        }
        
        return false;
      }
      
      setNetworkStatus("online");
      setError(null);
      setRetryCount(0); // Réinitialiser le compteur de tentatives si réussite
      return true;
    } catch (err: any) {
      console.error("Exception lors de la vérification de la connexion:", err);
      
      setNetworkStatus("offline");
      setError(`Erreur de connexion: ${err.message || "Erreur inconnue"}`);
      
      return false;
    }
  }, []);
  
  // Fonction de nouvelle tentative avec backoff exponentiel
  const retryConnection = useCallback(async () => {
    if (retryCount >= maxRetries) {
      console.log(`Nombre maximum de tentatives atteint (${maxRetries})`);
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Backoff exponentiel, max 10 secondes
    console.log(`Nouvelle tentative dans ${delay}ms (tentative ${retryCount + 1}/${maxRetries})`);
    
    setTimeout(async () => {
      const success = await checkServerConnection();
      
      if (!success && retryCount < maxRetries - 1) {
        setRetryCount(prev => prev + 1);
      }
    }, delay);
  }, [checkServerConnection, retryCount, maxRetries]);

  // Vérifier la connexion lorsque le composant est monté
  useEffect(() => {
    console.log("Vérification de la connexion au serveur...");
    
    checkServerConnection().then(success => {
      if (!success) {
        retryConnection();
      }
    });
    
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
    
    // Vérifier périodiquement la connexion si elle est offline (toutes les 30 secondes)
    const intervalId = setInterval(() => {
      if (networkStatus === "offline") {
        console.log("Vérification périodique de la connexion...");
        checkServerConnection();
      }
    }, 30000);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkServerConnection, networkStatus, retryConnection]);

  return {
    networkStatus,
    error,
    setError,
    checkServerConnection,
    retryConnection
  };
};
