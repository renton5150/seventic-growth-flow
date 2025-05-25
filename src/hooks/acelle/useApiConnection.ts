
import { useState, useCallback } from "react";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection, checkAcelleConnectionStatus } from "@/services/acelle/api/connection";

// Hook pour vérifier la connexion à l'API Acelle directement
export function useApiConnection(account?: AcelleAccount) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Vérifie si l'API est disponible en utilisant les appels directs
  const checkApiAvailability = useCallback(async () => {
    if (!account) {
      setLastCheckResult(false);
      return false;
    }

    try {
      setIsChecking(true);
      
      console.log(`Vérification de la connexion pour le compte ${account.name}`);
      
      // Utiliser la nouvelle fonction de test de connexion directe
      const result = await checkAcelleConnectionStatus(account);
      
      setLastCheckResult(result.success);
      
      // Convertir le résultat en format AcelleConnectionDebug en accédant sûrement aux propriétés
      const debugResult: AcelleConnectionDebug = {
        success: result.success,
        timestamp: new Date().toISOString(),
        errorMessage: result.success ? undefined : result.message,
        statusCode: result.success ? 200 : undefined,
        duration: result.details && 'duration' in result.details ? result.details.duration : 0
      };
      
      setDebugInfo(debugResult);
      
      return result.success;
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

  // Récupère des informations de diagnostic en utilisant les appels directs
  const getDebugInfo = useCallback(async (): Promise<AcelleConnectionDebug> => {
    if (!account || !account.api_token || !account.api_endpoint) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Informations de compte manquantes"
      };
    }

    try {
      console.log(`Récupération des infos de diagnostic pour ${account.name}`);
      
      // Utiliser la fonction de test directe
      const result = await testAcelleConnection(
        account.api_endpoint,
        account.api_token
      );
      
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

  // Fonction simplifiée pour le réveil (plus nécessaire avec les appels directs)
  const wakeUpEdgeFunctions = useCallback(async () => {
    console.log("Edge Functions non utilisées, appels directs à l'API Acelle");
    return true;
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
