
import { useState, useCallback } from "react";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";

// Hook pour vérifier la connexion à l'API Acelle
export function useApiConnection(account?: AcelleAccount) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Réveille l'edge function avant utilisation
  const wakeUpEdgeFunctions = useCallback(async (token?: string | null) => {
    if (!token) return false;

    try {
      console.log("Réveil des edge functions...");
      
      const response = await fetch(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/ping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      console.log("Résultat du réveil:", result);
      
      return result.success;
    } catch (error) {
      console.error("Erreur lors du réveil des edge functions:", error);
      return false;
    }
  }, []);

  // Vérifie si l'API est disponible
  const checkApiAvailability = useCallback(async (token?: string | null) => {
    if (!account || !token) {
      setLastCheckResult(false);
      return false;
    }

    try {
      setIsChecking(true);
      
      // Construire l'URL pour la vérification
      const url = new URL(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/check-acelle-api`);
      url.searchParams.append("url", account.api_endpoint);
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      setLastCheckResult(result.success);
      setDebugInfo(result);
      
      return result.success;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      setLastCheckResult(false);
      
      const errorDebug: AcelleConnectionDebug = {
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(errorDebug);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [account]);

  // Récupère des informations de diagnostic
  const getDebugInfo = useCallback(async (token?: string | null): Promise<AcelleConnectionDebug> => {
    if (!account || !token) {
      return {
        success: false,
        errorMessage: "Aucun compte ou token fourni",
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Construire l'URL pour la vérification
      const url = new URL(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/check-acelle-api`);
      url.searchParams.append("url", account.api_endpoint);
      url.searchParams.append("token", account.api_token);
      url.searchParams.append("detailed", "true");
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      setDebugInfo(result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la récupération des infos de diagnostic:", error);
      const errorInfo: AcelleConnectionDebug = {
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      setDebugInfo(errorInfo);
      return errorInfo;
    }
  }, [account]);

  return {
    isChecking,
    lastCheckResult,
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo,
    debugInfo
  };
}
