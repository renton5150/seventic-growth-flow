
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useConnectionCheck = () => {
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("checking");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkServerConnection = async (): Promise<boolean> => {
    setNetworkStatus("checking");
    
    // Check if browser is online
    if (!navigator.onLine) {
      console.log("Network connection unavailable");
      setNetworkStatus("offline");
      setError("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      return false;
    }
    
    try {
      console.log(`Test de connexion Supabase: tentative ${retryCount + 1}/3`);
      const start = Date.now();
      
      // Try a simple query to test connection
      const { error: queryError } = await supabase.from("profiles").select("count").limit(1);
      
      const elapsed = Date.now() - start;
      console.log(`Temps de réponse du serveur Supabase: ${elapsed}ms`);
      
      if (queryError) {
        console.error("Erreur de connexion à Supabase:", queryError);
        setNetworkStatus("offline");
        setError(`Problème de connexion au serveur: ${queryError.message}`);
        return false;
      }
      
      console.log(`Test de connexion Supabase: Succès en ${elapsed}ms`);
      console.log(`Connexion à Supabase réussie en ${elapsed}ms`);
      
      setNetworkStatus("online");
      setError(null);
      return true;
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      setNetworkStatus("offline");
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Problème de connexion au serveur: ${errorMessage}`);
      return false;
    }
  };
  
  // Check connection on component load
  useEffect(() => {
    const checkConnection = async () => {
      console.log("Vérification de la connexion au serveur...");
      await checkServerConnection();
    };
    
    checkConnection();
    
    // Watch for connectivity changes
    const handleOnline = () => {
      console.log("Network connection restored");
      checkServerConnection();
    };
    
    const handleOffline = () => {
      console.log("Network connection lost");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  // Function to retry connection
  const handleRetryConnection = async () => {
    setRetryCount(prev => prev + 1);
    await checkServerConnection();
  };
  
  return { 
    networkStatus, 
    error, 
    setError, 
    checkServerConnection, 
    retryCount, 
    handleRetry: handleRetryConnection 
  };
};
