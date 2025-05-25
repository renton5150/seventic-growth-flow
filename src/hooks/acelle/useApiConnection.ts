
import { useState, useCallback } from "react";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

// Hook pour vérifier la connexion à l'API Acelle via Edge Functions uniquement
export function useApiConnection(account?: AcelleAccount) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Vérifie si l'API est disponible en utilisant uniquement les Edge Functions
  const checkApiAvailability = useCallback(async () => {
    if (!account) {
      setLastCheckResult(false);
      return false;
    }

    try {
      setIsChecking(true);
      
      console.log(`Vérification de la connexion pour le compte ${account.name} via Edge Function`);
      
      // Utiliser uniquement l'edge function pour éviter les problèmes CORS
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'check_status'
        }
      });
      
      if (error) {
        console.error("Erreur Edge Function:", error);
        throw new Error(error.message || "Erreur de connexion via Edge Function");
      }
      
      const success = data?.success || false;
      setLastCheckResult(success);
      
      const debugResult: AcelleConnectionDebug = {
        success: success,
        timestamp: new Date().toISOString(),
        errorMessage: success ? undefined : (data?.message || "Connexion échouée"),
        responseTime: data?.duration,
        apiVersion: data?.apiVersion,
        responseData: data?.responseData
      };
      
      setDebugInfo(debugResult);
      
      return success;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      setLastCheckResult(false);
      setDebugInfo({
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [account]);

  // Récupère des informations de diagnostic via Edge Functions uniquement
  const getDebugInfo = useCallback(async (): Promise<AcelleConnectionDebug> => {
    if (!account || !account.api_token || !account.api_endpoint) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Informations de compte manquantes"
      };
    }

    try {
      console.log(`Récupération des infos de diagnostic pour ${account.name} via Edge Function`);
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'get_debug_info'
        }
      });
      
      if (error) {
        throw new Error(error.message || "Erreur de connexion via Edge Function");
      }
      
      const result: AcelleConnectionDebug = {
        success: data?.success || false,
        timestamp: new Date().toISOString(),
        errorMessage: data?.success ? undefined : (data?.message || "Diagnostic échoué"),
        responseTime: data?.duration,
        apiVersion: data?.apiVersion,
        responseData: data?.responseData
      };
      
      setDebugInfo(result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la récupération des infos de diagnostic:", error);
      const errorInfo = {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      setDebugInfo(errorInfo);
      return errorInfo;
    }
  }, [account]);

  // Fonction pour réveiller les Edge Functions
  const wakeUpEdgeFunctions = useCallback(async () => {
    try {
      console.log("Réveil des Edge Functions...");
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { action: 'ping' }
      });
      
      if (error) {
        console.error("Erreur réveil Edge Functions:", error);
        return false;
      }
      
      console.log("Edge Functions réveillées:", data);
      return true;
    } catch (error) {
      console.error("Erreur réveil Edge Functions:", error);
      return false;
    }
  }, []);

  return {
    isChecking,
    lastCheckResult,
    checkApiAvailability,
    getDebugInfo,
    debugInfo,
    wakeUpEdgeFunctions
  };
}
