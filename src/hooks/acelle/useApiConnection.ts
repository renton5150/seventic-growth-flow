
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour gérer la connexion API avec Acelle
 */
export const useApiConnection = (account: AcelleAccount) => {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  // Réveiller les Edge Functions de Supabase qui peuvent être endormies
  const wakeUpEdgeFunctions = useCallback(async (token: string | null) => {
    try {
      console.log("Réveil des Edge Functions...");
      
      if (!token) {
        console.warn("Pas de token disponible pour réveiller les Edge Functions");
        return false;
      }
      
      // Appeler une fonction simple pour réveiller l'environnement
      const { data, error } = await supabase.functions.invoke("ping", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (error) {
        console.error("Erreur lors du réveil des Edge Functions:", error);
        return false;
      }
      
      console.log("Edge Functions réveillées avec succès:", data);
      return true;
    } catch (error) {
      console.error("Erreur lors du réveil des Edge Functions:", error);
      return false;
    }
  }, []);

  // Vérifier la disponibilité de l'API Acelle
  const checkApiAvailability = useCallback(async () => {
    if (!account?.id || !account?.apiEndpoint) {
      return { success: false, message: "Compte invalide ou sans point de terminaison API" };
    }
    
    try {
      setIsCheckingConnection(true);
      
      const connectionStatus = await testAcelleConnection(account);
      setDebugInfo(connectionStatus);
      setLastTestTime(new Date());
      
      if (connectionStatus.success) {
        setEndpointStatus('online');
        return { success: true, message: "API accessible" };
      } else {
        setEndpointStatus('offline');
        return { 
          success: false, 
          message: connectionStatus.errorMessage || "API inaccessible"
        };
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion Acelle:", error);
      setEndpointStatus('offline');
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      setIsCheckingConnection(false);
    }
  }, [account]);

  // Diagnostic complet du système
  const getDebugInfo = useCallback(async () => {
    try {
      if (!account?.id) {
        return { success: false, message: "Compte invalide" };
      }
      
      // Exécuter le diagnostic
      const debugResult = await testAcelleConnection(account);
      setDebugInfo(debugResult);
      setLastTestTime(new Date());
      
      return {
        success: true,
        data: debugResult
      };
    } catch (error) {
      console.error("Erreur lors de l'obtention des informations de débogage:", error);
      return {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }, [account]);

  return {
    isCheckingConnection,
    endpointStatus,
    debugInfo,
    lastTestTime,
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo
  };
};
